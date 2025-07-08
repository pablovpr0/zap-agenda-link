
const SettingsHelpSection = () => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
      <p className="font-medium mb-2">💡 Dicas:</p>
      <ul className="space-y-1 text-xs">
        <li>• Telefone: usado para receber confirmações via WhatsApp</li>
        <li>• Link personalizado: torne sua URL mais profissional</li>
        <li>• Limite mensal: evita que clientes façam muitos agendamentos</li>
        <li>• Horário de almoço: período em que não haverá agendamentos disponíveis</li>
        <li>• Intervalo: tempo entre agendamentos consecutivos</li>
        <li>• Máx. Simultâneos: quantos clientes podem ser atendidos ao mesmo tempo</li>
        <li>• Limite Antecipação: quantos dias no futuro os clientes podem agendar</li>
      </ul>
    </div>
  );
};

export default SettingsHelpSection;
