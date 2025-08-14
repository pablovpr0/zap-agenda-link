
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

interface TimeSlotRequest {
  companyId: string
  selectedDate: string
  serviceDuration?: number
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { companyId, selectedDate, serviceDuration = 60 }: TimeSlotRequest = await req.json()

    console.log(`🔍 Buscando horários para empresa ${companyId} em ${selectedDate}`)

    // Get current time in Brazil timezone
    const nowInBrazil = new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
    const todayInBrazil = new Date(nowInBrazil).toISOString().split('T')[0]
    const currentTimeInBrazil = new Date(nowInBrazil).toTimeString().substring(0, 5)

    console.log(`🕐 Data/hora atual no Brasil: ${todayInBrazil} ${currentTimeInBrazil}`)

    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const dateObj = new Date(selectedDate + 'T12:00:00')
    const dayOfWeek = dateObj.getDay()

    // First try to get schedule from daily_schedules
    const { data: dailySchedule, error: scheduleError } = await supabase
      .from('daily_schedules')
      .select('start_time, end_time, is_active, has_lunch_break, lunch_start, lunch_end')
      .eq('company_id', companyId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .single()

    let startTime: string
    let endTime: string
    let lunchBreakEnabled = false
    let lunchStart: string | null = null
    let lunchEnd: string | null = null

    if (scheduleError || !dailySchedule) {
      console.log(`⚠️ Configuração diária não encontrada, usando fallback`)
      
      // Fallback to company_settings
      const { data: companySettings, error: settingsError } = await supabase
        .from('company_settings')
        .select('working_days, working_hours_start, working_hours_end, lunch_break_enabled, lunch_start_time, lunch_end_time')
        .eq('company_id', companyId)
        .single()

      if (settingsError || !companySettings) {
        throw new Error('Configurações da empresa não encontradas')
      }

      // Check if company works on this day
      const workingDays = companySettings.working_days || []
      if (!workingDays.includes(dayOfWeek === 0 ? 7 : dayOfWeek)) {
        console.log(`🚫 Empresa fechada no dia ${dayOfWeek}`)
        return new Response(
          JSON.stringify({ availableTimes: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      startTime = companySettings.working_hours_start
      endTime = companySettings.working_hours_end
      lunchBreakEnabled = companySettings.lunch_break_enabled || false
      lunchStart = companySettings.lunch_start_time
      lunchEnd = companySettings.lunch_end_time
    } else {
      startTime = dailySchedule.start_time
      endTime = dailySchedule.end_time
      lunchBreakEnabled = dailySchedule.has_lunch_break || false
      lunchStart = dailySchedule.lunch_start
      lunchEnd = dailySchedule.lunch_end
    }

    console.log(`⏰ Horário de funcionamento: ${startTime} - ${endTime}`)
    if (lunchBreakEnabled) {
      console.log(`🍽️ Intervalo de almoço: ${lunchStart} - ${lunchEnd}`)
    }

    // Get existing appointments for the date
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('appointment_time, duration, services(duration)')
      .eq('company_id', companyId)
      .eq('appointment_date', selectedDate)
      .neq('status', 'cancelled')

    if (appointmentsError) {
      console.error('❌ Erro ao buscar agendamentos:', appointmentsError)
      throw appointmentsError
    }

    console.log(`📋 Agendamentos encontrados: ${appointments?.length || 0}`)

    // Generate available time slots
    const availableTimes: string[] = []
    const intervalMinutes = 30 // Fixed 30-minute intervals

    // Convert start time to minutes
    let currentMinutes = timeToMinutes(startTime)
    const endMinutes = timeToMinutes(endTime)
    const currentTimeMinutes = selectedDate === todayInBrazil ? timeToMinutes(currentTimeInBrazil) : 0

    while (currentMinutes < endMinutes) {
      const timeSlot = minutesToTime(currentMinutes)
      
      // Skip past times if it's today (with 30min buffer)
      if (selectedDate === todayInBrazil && currentMinutes <= currentTimeMinutes + 30) {
        currentMinutes += intervalMinutes
        continue
      }

      // Check if slot is during lunch break
      if (lunchBreakEnabled && lunchStart && lunchEnd) {
        const lunchStartMinutes = timeToMinutes(lunchStart)
        const lunchEndMinutes = timeToMinutes(lunchEnd)
        
        if (currentMinutes >= lunchStartMinutes && currentMinutes < lunchEndMinutes) {
          currentMinutes += intervalMinutes
          continue
        }
      }

      // Check if there's enough time for the service
      if (currentMinutes + serviceDuration > endMinutes) {
        break
      }

      // Check conflicts with existing appointments
      const hasConflict = appointments?.some(apt => {
        const aptTimeSlot = apt.appointment_time.substring(0, 5)
        const aptDuration = apt.services?.duration || apt.duration || 60
        const aptStartMinutes = timeToMinutes(aptTimeSlot)
        
        // Check for overlap
        return (currentMinutes < aptStartMinutes + aptDuration) && 
               (currentMinutes + serviceDuration > aptStartMinutes)
      })

      if (!hasConflict) {
        availableTimes.push(timeSlot)
      }

      currentMinutes += intervalMinutes
    }

    console.log(`✅ ${availableTimes.length} horários disponíveis: ${availableTimes.join(', ')}`)

    return new Response(
      JSON.stringify({ availableTimes }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Erro na função:', error)
    return new Response(
      JSON.stringify({ error: error.message, availableTimes: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Helper functions
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}
