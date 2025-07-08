
const SlugTips = () => {
  return (
    <div className="text-sm text-gray-600">
      <p className="font-medium mb-1">Dicas:</p>
      <ul className="text-xs space-y-1 list-disc list-inside">
        <li>Use apenas letras minúsculas, números e hífens</li>
        <li>Mantenha entre 3-50 caracteres</li>
        <li>Evite hífens no início ou fim</li>
      </ul>
    </div>
  );
};

export default SlugTips;
