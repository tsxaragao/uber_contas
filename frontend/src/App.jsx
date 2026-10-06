import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [errorPin, setErrorPin] = useState('');
  const [registros, setRegistros] = useState([]);
  const [form, setForm] = useState({
    dia: new Date().toISOString().split('T')[0],
    inicio: '06:00',
    fim: '12:00',
    gasolina: 6.99,
    consumo: 11.5,
    km: 0,
    faturado: 0
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (authenticated) {
      carregarRegistros();
    }
  }, [authenticated]);

  const handleAuth = (e) => {
    e.preventDefault();
    if (pin === '78901234') {
      setAuthenticated(true);
      setErrorPin('');
    } else {
      setErrorPin('Código de acesso inválido.');
    }
  };

  const carregarRegistros = async () => {
    try {
      const res = await fetch(`${API_URL}/registros`);
      const data = await res.json();
      setRegistros(data);
    } catch (err) {
      console.error("Erro ao carregar dados", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `${API_URL}/registros/${editingId}` : `${API_URL}/registros`;

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });

    setForm({
      dia: new Date().toISOString().split('T')[0],
      inicio: '06:00',
      fim: '12:00',
      gasolina: 6.99,
      consumo: 11.5,
      km: 0,
      faturado: 0
    });
    setEditingId(null);
    carregarRegistros();
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({
      dia: item.dia,
      inicio: item.inicio,
      fim: item.fim,
      gasolina: item.gasolina,
      consumo: item.consumo,
      km: item.km,
      faturado: item.faturado
    });
  };

  const handleDelete = async (id) => {
    if (confirm("Deseja apagar este registro?")) {
      await fetch(`${API_URL}/registros/${id}`, { method: 'DELETE' });
      carregarRegistros();
    }
  };

  // Tela Neutra de Autenticação
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <form onSubmit={handleAuth} className="bg-slate-800 p-8 rounded-xl shadow-xl w-full max-w-sm border border-slate-700">
          <h2 className="text-xl font-bold mb-6 text-center text-slate-200">Acesso Restrito</h2>
          <div className="mb-4">
            <input
              type="password"
              placeholder="Digite o PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-center text-2xl tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={8}
            />
          </div>
          {errorPin && <p className="text-red-400 text-sm mb-4 text-center">{errorPin}</p>}
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 font-semibold p-3 rounded-lg transition">
            Entrar
          </button>
        </form>
      </div>
    );
  }

  // Dashboard de Gestão
  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <header className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Controle Operacional - Uber</h1>
            <p className="text-slate-5-00 text-sm">Acompanhamento de rotas e rentabilidade</p>
          </div>
          <button onClick={() => setAuthenticated(false)} className="text-sm text-red-600 hover:underline">
            Sair
          </button>
        </header>

        {/* Formulário CRUD */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold mb-4">{editingId ? 'Editar Turno' : 'Novo Turno'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Dia</label>
              <input type="date" value={form.dia} onChange={e => setForm({...form, dia: e.target.value})} className="w-full p-2 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Início</label>
              <input type="time" value={form.inicio} onChange={e => setForm({...form, inicio: e.target.value})} className="w-full p-2 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Fim</label>
              <input type="time" value={form.fim} onChange={e => setForm({...form, fim: e.target.value})} className="w-full p-2 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Gasolina (R$)</label>
              <input type="number" step="0.01" value={form.gasolina} onChange={e => setForm({...form, gasolina: parseFloat(e.target.value)})} className="w-full p-2 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Consumo (km/l)</label>
              <input type="number" step="0.1" value={form.consumo} onChange={e => setForm({...form, consumo: parseFloat(e.target.value)})} className="w-full p-2 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">KM Rodado</label>
              <input type="number" step="0.1" value={form.km} onChange={e => setForm({...form, km: parseFloat(e.target.value)})} className="w-full p-2 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Faturado (R$)</label>
              <input type="number" step="0.01" value={form.faturado} onChange={e => setForm({...form, faturado: parseFloat(e.target.value)})} className="w-full p-2 border rounded-lg" required />
            </div>
            <div className="col-span-2 md:col-span-1 flex items-end gap-2">
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold p-2 rounded-lg transition">
                {editingId ? 'Salvar' : 'Adicionar'}
              </button>
              {editingId && (
                <button type="button" onClick={() => setEditingId(null)} className="bg-slate-300 p-2 rounded-lg text-xs">
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Tabela de Dados */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                <th className="p-4">Data</th>
                <th className="p-4">Turno</th>
                <th className="p-4">Horas</th>
                <th className="p-4">Faturado</th>
                <th className="p-4">Lucro Liq.</th>
                <th className="p-4">Lucro Liq/h</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {registros.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="p-4 font-medium">{item.dia}</td>
                  <td className="p-4 text-slate-500">{item.inicio} - {item.fim}</td>
                  <td className="p-4">{item.tempo_formatado}h</td>
                  <td className="p-4 text-emerald-700 font-semibold">R$ {item.faturado.toFixed(2)}</td>
                  <td className="p-4 font-bold text-slate-900">R$ {item.lucro_liquido.toFixed(2)}</td>
                  <td className="p-4 text-blue-600 font-semibold">R$ {item.lucro_hora.toFixed(2)}/h</td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={() => handleEdit(item)} className="text-blue-600 hover:underline text-xs">Editar</button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:underline text-xs">Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}