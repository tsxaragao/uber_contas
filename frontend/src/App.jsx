import React, { useState, useEffect, useMemo } from 'react';

const API_URL = '/api';
const DIAS_SEMANA_SIGLAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [errorPin, setErrorPin] = useState('');
  
  const [registros, setRegistros] = useState([]);
  const [modoExibicao, setModoExibicao] = useState('liquido'); // 'faturado' ou 'liquido'
  const [diaSelecionado, setDiaSelecionado] = useState(null);
  const [view, setView] = useState('painel'); // 'painel', 'tabela', 'formulario'

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    dia: new Date().toISOString().split('T')[0],
    inicio: '06:00',
    fim: '12:00',
    gasolina: 6.99,
    consumo: 11.5,
    km: 0,
    faturado: 0
  });

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

  // Cálculo dos dias da semana corrente (Segunda a Domingo)
  const dadosSemana = useMemo(() => {
    const hoje = new Date();
    const diaDaSemana = hoje.getDay(); // 0 = Dom, 1 = Seg...
    const diffParaSegunda = (diaDaSemana === 0 ? -6 : 1 - diaDaSemana);
    
    const segunda = new Date(hoje);
    segunda.setDate(hoje.getDate() + diffParaSegunda);

    const dias = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(segunda);
      d.setDate(segunda.getDate() + i);
      const isoDate = d.toISOString().split('T')[0];
      const diaNum = d.getDate();
      
      const regsdia = registros.filter(r => r.dia === isoDate);
      const totalFaturado = regsdia.reduce((acc, r) => acc + (r.faturado || 0), 0);
      const totalLiquido = regsdia.reduce((acc, r) => acc + (r.lucro_liquido || 0), 0);
      const totalHoras = regsdia.reduce((acc, r) => acc + (r.tempo_horas || 0), 0);

      dias.push({
        dataISO: isoDate,
        diaNum,
        sigla: DIAS_SEMANA_SIGLAS[i],
        faturado: totalFaturado,
        liquido: totalLiquido,
        horas: totalHoras,
        qtdTurnos: regsdia.length
      });
    }

    const totalFaturadoSemana = dias.reduce((acc, d) => acc + d.faturado, 0);
    const totalLiquidoSemana = dias.reduce((acc, d) => acc + d.liquido, 0);
    const totalHorasSemana = dias.reduce((acc, d) => acc + d.horas, 0);

    return {
      dias,
      totalFaturadoSemana,
      totalLiquidoSemana,
      totalHorasSemana,
    };
  }, [registros]);

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
    
    // Regra: Voltar para o painel no modo lucro líquido
    setModoExibicao('liquido');
    setView('painel');
    setDiaSelecionado(null);
    await carregarRegistros();
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
    setView('formulario');
  };

  const handleDelete = async (id) => {
    if (confirm("Deseja apagar este registro?")) {
      await fetch(`${API_URL}/registros/${id}`, { method: 'DELETE' });
      setModoExibicao('liquido');
      setView('painel');
      setDiaSelecionado(null);
      await carregarRegistros();
    }
  };

  const registrosFiltrados = diaSelecionado 
    ? registros.filter(r => r.dia === diaSelecionado)
    : registros;

  const maxValor = Math.max(
    ...dadosSemana.dias.map(d => modoExibicao === 'faturado' ? d.faturado : d.liquido),
    50
  );

  if (!authenticated) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#000000', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <form onSubmit={handleAuth} style={{ backgroundColor: '#18181b', padding: '2rem', borderRadius: '1rem', border: '1px solid #27272a', width: '100%', maxWidth: '350px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center' }}>Acesso Restrito</h2>
          <input
            type="password"
            placeholder="PIN de Acesso"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '0.5rem', color: '#ffffff', textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.25em', marginBottom: '1rem', boxSizing: 'border-box' }}
            maxLength={8}
          />
          {errorPin && <p style={{ color: '#f87171', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>{errorPin}</p>}
          <button type="submit" style={{ width: '100%', backgroundColor: '#ffffff', color: '#000000', fontWeight: 'bold', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}>
            Entrar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000000', color: '#ffffff', padding: '1rem', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      {/* Top Bar */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {view !== 'painel' && (
            <button 
              onClick={() => { setView('painel'); setDiaSelecionado(null); }}
              style={{ backgroundColor: '#27272a', color: '#ffffff', border: '1px solid #3f3f46', padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.875rem', cursor: 'pointer', fontWeight: '600' }}
            >
              ← Painel
            </button>
          )}
          <button 
            onClick={() => {
              setEditingId(null);
              setForm({
                dia: new Date().toISOString().split('T')[0],
                inicio: '06:00',
                fim: '12:00',
                gasolina: 6.99,
                consumo: 11.5,
                km: 0,
                faturado: 0
              });
              setView(view === 'formulario' ? 'painel' : 'formulario');
            }}
            style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.875rem', cursor: 'pointer', fontWeight: '600' }}
          >
            {view === 'formulario' ? 'Ver Painel' : '+ Novo Turno'}
          </button>
        </div>
        <button onClick={() => setAuthenticated(false)} style={{ backgroundColor: 'transparent', border: 'none', color: '#a1a1aa', fontSize: '0.75rem', cursor: 'pointer' }}>
          Sair
        </button>
      </header>

      {/* VISTA 1: PAINEL ESTILO UBER */}
      {view === 'painel' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Botão Alternador (Faturado vs Líquido) */}
          <div style={{ display: 'flex', backgroundColor: '#18181b', padding: '0.25rem', borderRadius: '1rem', border: '1px solid #27272a' }}>
            <button
              onClick={() => setModoExibicao('faturado')}
              style={{ flex: 1, padding: '0.6rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem', backgroundColor: modoExibicao === 'faturado' ? '#27272a' : 'transparent', color: modoExibicao === 'faturado' ? '#ffffff' : '#a1a1aa' }}
            >
              Faturado (Bruto)
            </button>
            <button
              onClick={() => setModoExibicao('liquido')}
              style={{ flex: 1, padding: '0.6rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem', backgroundColor: modoExibicao === 'liquido' ? '#059669' : 'transparent', color: modoExibicao === 'liquido' ? '#ffffff' : '#a1a1aa' }}
            >
              Lucro Líquido
            </button>
          </div>

          {/* Cartão de Ganhos Semanal */}
          <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '1.5rem', padding: '1.5rem', textAlign: 'center' }}>
            <p style={{ color: '#a1a1aa', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
              Ganhos da Semana • {modoExibicao === 'faturado' ? 'Faturado' : 'Lucro Líquido'}
            </p>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '800', margin: '0 0 1.5rem 0' }}>
              R$ {(modoExibicao === 'faturado' ? dadosSemana.totalFaturadoSemana : dadosSemana.totalLiquidoSemana).toFixed(2)}
            </h1>

            {/* Gráfico de Barras com Colunas Verticais */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', alignItems: 'flex-end', height: '180px', borderBottom: '1px solid #27272a', paddingBottom: '0.75rem' }}>
              {dadosSemana.dias.map((d) => {
                const valorExibido = modoExibicao === 'faturado' ? d.faturado : d.liquido;
                const alturaPct = maxValor > 0 ? (valorExibido / maxValor) * 100 : 0;
                const minAltura = valorExibido > 0 ? Math.max(alturaPct, 12) : 4;
                const isSelected = diaSelecionado === d.dataISO;

                return (
                  <button
                    key={d.dataISO}
                    onClick={() => {
                      setDiaSelecionado(d.dataISO);
                      setView('tabela');
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', padding: 0 }}
                  >
                    <span style={{ fontSize: '0.65rem', color: '#a1a1aa', marginBottom: '0.25rem' }}>
                      {valorExibido > 0 ? `R$${Math.round(valorExibido)}` : ''}
                    </span>
                    <div style={{ width: '100%', backgroundColor: '#27272a', borderRadius: '0.375rem 0.375rem 0 0', height: '120px', display: 'flex', alignItems: 'flex-end' }}>
                      <div
                        style={{
                          width: '100%',
                          height: `${minAltura}%`,
                          backgroundColor: isSelected 
                            ? '#ffffff' 
                            : valorExibido > 0 
                            ? (modoExibicao === 'faturado' ? '#3b82f6' : '#10b981')
                            : '#3f3f46',
                          borderRadius: '0.375rem 0.375rem 0 0',
                          transition: 'height 0.3s ease'
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#ffffff', marginTop: '0.5rem' }}>{d.diaNum}</span>
                    <span style={{ fontSize: '0.65rem', color: '#71717a', textTransform: 'uppercase' }}>{d.sigla}</span>
                  </button>
                );
              })}
            </div>

            {/* Métrica de Horas e Média/Hora estilo Uber */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.25rem' }}>
              <div style={{ backgroundColor: '#09090b', padding: '1rem', borderRadius: '1rem', border: '1px solid #27272a', textAlign: 'left' }}>
                <p style={{ fontSize: '0.75rem', color: '#a1a1aa', margin: 0 }}>Horas Online</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0.25rem 0 0 0', color: '#ffffff' }}>{dadosSemana.totalHorasSemana.toFixed(1)} h</p>
              </div>
              <div style={{ backgroundColor: '#09090b', padding: '1rem', borderRadius: '1rem', border: '1px solid #27272a', textAlign: 'left' }}>
                <p style={{ fontSize: '0.75rem', color: '#a1a1aa', margin: 0 }}>Média / Hora</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0.25rem 0 0 0', color: '#34d399' }}>
                  R$ {dadosSemana.totalHorasSemana > 0 
                    ? ((modoExibicao === 'faturado' ? dadosSemana.totalFaturadoSemana : dadosSemana.totalLiquidoSemana) / dadosSemana.totalHorasSemana).toFixed(2)
                    : '0.00'}/h
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => { setDiaSelecionado(null); setView('tabela'); }}
            style={{ backgroundColor: 'transparent', border: 'none', color: '#a1a1aa', fontSize: '0.75rem', textDecoration: 'underline', cursor: 'pointer', textAlign: 'center' }}
          >
            Ver histórico completo de entradas
          </button>
        </div>
      )}

      {/* VISTA 2: LISTA DE REGISTROS DO DIA SELECIONADO */}
      {view === 'tabela' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#18181b', padding: '1rem', borderRadius: '1rem', border: '1px solid #27272a' }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 'bold', margin: 0 }}>
                {diaSelecionado ? `Entradas (${diaSelecionado})` : 'Todas as Entradas'}
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#a1a1aa', margin: '0.25rem 0 0 0' }}>{registrosFiltrados.length} turno(s)</p>
            </div>
            {diaSelecionado && (
              <button onClick={() => setDiaSelecionado(null)} style={{ backgroundColor: 'transparent', border: 'none', color: '#60a5fa', fontSize: '0.75rem', cursor: 'pointer' }}>
                Ver Todos
              </button>
            )}
          </div>

          {registrosFiltrados.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#18181b', borderRadius: '1rem', border: '1px solid #27272a', color: '#a1a1aa' }}>
              Nenhum registro para este dia.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {registrosFiltrados.map((item) => (
                <div key={item.id} style={{ backgroundColor: '#18181b', border: '1px solid #27272a', padding: '1rem', borderRadius: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 'bold' }}>{item.dia}</span>
                      <span style={{ fontSize: '0.75rem', color: '#a1a1aa', backgroundColor: '#27272a', padding: '0.1rem 0.5rem', borderRadius: '1rem' }}>{item.inicio} - {item.fim}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#a1a1aa', marginTop: '0.5rem', display: 'flex', gap: '0.75rem' }}>
                      <span>{item.km} km</span>
                      <span>{item.consumo} km/l</span>
                      <span>R${item.gasolina}/l</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '0.75rem', color: '#a1a1aa', margin: 0 }}>Bruto: R$ {item.faturado.toFixed(2)}</p>
                    <p style={{ fontSize: '1rem', fontWeight: 'bold', color: '#34d399', margin: '0.25rem 0' }}>Liq: R$ {item.lucro_liquido.toFixed(2)}</p>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleEdit(item)} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '0.75rem', cursor: 'pointer' }}>Editar</button>
                      <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '0.75rem', cursor: 'pointer' }}>Excluir</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VISTA 3: FORMULÁRIO DE CADASTRO/EDIÇÃO */}
      {view === 'formulario' && (
        <div style={{ backgroundColor: '#18181b', padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid #27272a' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>{editingId ? 'Editar Turno' : 'Novo Turno'}</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '0.25rem' }}>Data</label>
              <input type="date" value={form.dia} onChange={e => setForm({...form, dia: e.target.value})} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '0.5rem', color: '#ffffff', boxSizing: 'border-box' }} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '0.25rem' }}>Início</label>
                <input type="time" value={form.inicio} onChange={e => setForm({...form, inicio: e.target.value})} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '0.5rem', color: '#ffffff', boxSizing: 'border-box' }} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '0.25rem' }}>Fim</label>
                <input type="time" value={form.fim} onChange={e => setForm({...form, fim: e.target.value})} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '0.5rem', color: '#ffffff', boxSizing: 'border-box' }} required />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '0.25rem' }}>Gasolina (R$)</label>
                <input type="number" step="0.01" value={form.gasolina} onChange={e => setForm({...form, gasolina: parseFloat(e.target.value) || 0})} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '0.5rem', color: '#ffffff', boxSizing: 'border-box' }} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '0.25rem' }}>Consumo (km/l)</label>
                <input type="number" step="0.1" value={form.consumo} onChange={e => setForm({...form, consumo: parseFloat(e.target.value) || 0})} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '0.5rem', color: '#ffffff', boxSizing: 'border-box' }} required />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '0.25rem' }}>KM Rodados</label>
                <input type="number" step="0.1" value={form.km} onChange={e => setForm({...form, km: parseFloat(e.target.value) || 0})} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '0.5rem', color: '#ffffff', boxSizing: 'border-box' }} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '0.25rem' }}>Faturado (R$)</label>
                <input type="number" step="0.01" value={form.faturado} onChange={e => setForm({...form, faturado: parseFloat(e.target.value) || 0})} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '0.5rem', color: '#ffffff', boxSizing: 'border-box' }} required />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="submit" style={{ flex: 1, backgroundColor: '#059669', color: '#ffffff', fontWeight: 'bold', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}>
                {editingId ? 'Salvar' : 'Cadastrar Turno'}
              </button>
              <button type="button" onClick={() => setView('painel')} style={{ backgroundColor: '#27272a', color: '#ffffff', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}