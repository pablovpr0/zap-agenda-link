import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { checkAvailableTimes } from '@/services/publicBookingService';

const TimeSlotDebug = () => {
  const [companyId, setCompanyId] = useState('21a30258-691c-4d13-bdb6-ac9bb86398ee'); // Pablo's company
  const [selectedDate, setSelectedDate] = useState('2025-08-06'); // Tomorrow
  const [serviceDuration, setServiceDuration] = useState(60);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  // Capture console.log for debugging
  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = (...args) => {
      setLogs(prev => [...prev, `LOG: ${args.join(' ')}`]);
      originalLog(...args);
    };
    
    console.error = (...args) => {
      setLogs(prev => [...prev, `ERROR: ${args.join(' ')}`]);
      originalError(...args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
    };
  }, []);

  const testTimeSlots = async () => {
    setLoading(true);
    setLogs([]);
    setAvailableTimes([]);
    
    try {
      console.log('🧪 Starting time slot test...');
      console.log('📋 Test parameters:', { companyId, selectedDate, serviceDuration });
      
      const times = await checkAvailableTimes(companyId, selectedDate, serviceDuration);
      setAvailableTimes(times);
      
      console.log('✅ Test completed, times:', times);
      console.log('📊 Summary:', {
        totalAvailableSlots: times.length,
        firstSlot: times[0] || 'None',
        lastSlot: times[times.length - 1] || 'None'
      });
    } catch (error) {
      console.error('❌ Test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Time Slot Debug Tool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="companyId">Company ID</Label>
              <Input
                id="companyId"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                placeholder="Company ID"
              />
            </div>
            <div>
              <Label htmlFor="selectedDate">Date (YYYY-MM-DD)</Label>
              <Input
                id="selectedDate"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="serviceDuration">Service Duration (minutes)</Label>
              <Input
                id="serviceDuration"
                type="number"
                value={serviceDuration}
                onChange={(e) => setServiceDuration(Number(e.target.value))}
                placeholder="60"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={testTimeSlots} disabled={loading}>
              {loading ? 'Testing...' : 'Test Time Slots'}
            </Button>
            <Button variant="outline" onClick={clearLogs}>
              Clear Logs
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Available Times ({availableTimes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {availableTimes.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {availableTimes.map((time) => (
                  <div
                    key={time}
                    className="p-2 bg-green-100 text-green-800 rounded text-center text-sm"
                  >
                    {time}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No available times found</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Debug Logs ({logs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto space-y-1">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`text-xs p-2 rounded ${
                    log.startsWith('ERROR:') 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TimeSlotDebug;