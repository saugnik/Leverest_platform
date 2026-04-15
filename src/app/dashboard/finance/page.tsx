'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Download, Plus, DollarSign, TrendingUp, Banknote, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';

function formatCurrency(amount: number) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export default function FinancePage() {
  const { user } = useAuth();
  
  const [finances, setFinances] = useState<any[]>([]);
  const [salaries, setSalaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [MOCK_USERS, setUsers] = useState<any[]>([]);

  // Forms
  const [fMonth, setFMonth] = useState('January');
  const [fYear, setFYear] = useState('2026');
  const [fRev, setFRev] = useState('');
  const [fExp, setFExp] = useState('');

  const [sEmail, setSEmail] = useState('');
  const [sMonth, setSMonth] = useState('January');
  const [sYear, setSYear] = useState('2026');
  const [sAmt, setSAmt] = useState('');
  const [sStatus, setSStatus] = useState('Unpaid');

  useEffect(() => {
    Promise.all([
      fetch('/api/finance').then(r => r.json()),
      fetch('/api/team').then(r => r.json())
    ]).then(([d, teamData]) => {
      setFinances(d.finances || []);
      setSalaries(d.salaries || []);
      if (teamData.members) setUsers(teamData.members);
      setLoading(false);
    }).catch(console.error);
  }, []);

  if (loading) return <div style={{ padding: '3rem', color: 'var(--text-3)', textAlign: 'center' }}>Loading financials...</div>;

  const isAdmin = user?.role === 'admin';
  const isAccountant = user?.role === 'accounts';
  const isEmployee = !isAdmin && !isAccountant;

  // Calculators
  const mySalaries = salaries.filter(s => s.user_email === user?.email);
  const processedFinances = finances.map(f => ({ ...f, profit: f.revenue - f.expenses, margin: Math.round((f.profit / (f.revenue || 1)) * 100) }));
  const totalRevenue = processedFinances.reduce((sum, f) => sum + f.revenue, 0);
  const totalExpenses = processedFinances.reduce((sum, f) => sum + f.expenses, 0);
  const totalProfit = processedFinances.reduce((sum, f) => sum + f.profit, 0);
  
  const lastMonth = processedFinances[processedFinances.length -1];
  const prevMonth = processedFinances[processedFinances.length -2];
  const momGrowth = (lastMonth && prevMonth && prevMonth.revenue) ? Math.round(((lastMonth.revenue - prevMonth.revenue) / prevMonth.revenue) * 100) : 0;

  const totalSalaries = salaries.reduce((sum, s) => sum + s.amount, 0);
  const totalPaidSalaries = salaries.filter(s => s.status === 'Paid').reduce((sum, s) => sum + s.amount, 0);

  // Handlers
  const handleAddFinance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fRev || !fExp) return;
    const res = await fetch('/api/finance', {
      method: 'POST', body: JSON.stringify({ type: 'ADD_FINANCE', month: fMonth, year: fYear, revenue: fRev, expenses: fExp })
    });
    const d = await res.json();
    setFinances(d.finances);
    setFRev(''); setFExp('');
  };

  const handleAddSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sEmail || !sAmt) return;
    const res = await fetch('/api/finance', {
      method: 'POST', body: JSON.stringify({ type: 'ADD_SALARY', user_email: sEmail, month: sMonth, year: sYear, amount: sAmt, status: sStatus })
    });
    const d = await res.json();
    setSalaries(d.salaries);
    setSEmail(''); setSAmt(''); setSStatus('Unpaid');
  };

  const handleMarkPaid = async (id: string) => {
    const res = await fetch('/api/finance', {
      method: 'POST', body: JSON.stringify({ type: 'UPDATE_SALARY_STATUS', id, status: 'Paid' })
    });
    const d = await res.json();
    setSalaries(d.salaries);
  };

  const exportCSV = () => {
    const headers = ['Month,Year,Revenue,Expenses,Profit'];
    const rows = finances.map(f => `${f.month},${f.year},${f.revenue},${f.expenses},${f.profit}`);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "Company_Financials.csv");
    document.body.appendChild(link); link.click();
  };

  // -------------------------------------------------------------
  // VIEW 1: STANDARD EMPLOYEE
  // -------------------------------------------------------------
  if (isEmployee) {
    return (
      <div style={{ padding: '1.75rem 2rem' }} className="fade-up">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '4px' }}>My Salary Record</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginBottom: '1.5rem' }}>View your monthly disbursed and pending salary records securely.</p>
        <div className="card">
          <div className="card-header"><div className="card-header-title">Personal Salary History</div></div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Month / Year</th><th>Amount</th><th>Status</th><th>Paid Date</th></tr></thead>
              <tbody>
                {mySalaries.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-4)', padding: '2rem' }}>No salary records available yet.</td></tr>
                ) : mySalaries.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-2)' }}>{s.month} {s.year}</td>
                    <td style={{ fontWeight: 700, color: 'var(--text-1)' }}>{formatCurrency(s.amount)}</td>
                    <td><span className={`pill ${s.status === 'Paid' ? 'pill-green' : 'pill-red'}`}>{s.status}</span></td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{s.paid_date ? new Date(s.paid_date).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // SHARED COMPONENT: SALARY TABLE LOGS (Differs by Role)
  // -------------------------------------------------------------
  const SalaryTable = () => (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Banknote size={18} color="var(--gold)" /> Salary Tracker (All Employees)
      </h2>
      <div className="card" style={{ height: isAccountant ? 'auto' : '350px', overflowY: isAccountant ? 'visible' : 'auto' }}>
        <div style={{ padding: '12px 16px', display: 'flex', gap: '15px', borderBottom: '1px solid var(--bg-border)', fontSize: '0.72rem' }}>
          <div><span style={{ color: 'var(--text-3)' }}>T. Payable: </span><span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{formatCurrency(totalSalaries)}</span></div>
          <div><span style={{ color: 'var(--text-3)' }}>T. Paid: </span><span style={{ fontWeight: 600, color: '#4ADE80' }}>{formatCurrency(totalPaidSalaries)}</span></div>
        </div>
        <table className="tbl">
          <thead><tr><th>Name</th><th>Month</th><th>Amount</th><th>Status</th>{isAccountant && <th>Action</th>}</tr></thead>
          <tbody>
            {salaries.length === 0 ? <tr><td colSpan={5} style={{textAlign:'center', color:'var(--text-4)', padding:'2rem'}}>No salaries booked.</td></tr> : salaries.map(s => {
              const emp = MOCK_USERS.find(x => x.email === s.user_email);
              return (
              <tr key={s.id}>
                <td><div style={{ fontWeight: 600, color: 'var(--text-2)' }}>{emp?.name || s.user_email}</div></td>
                <td style={{ fontSize:'0.75rem' }}>{s.month} '{s.year.slice(-2)}</td>
                <td style={{ fontWeight: 700 }}>{formatCurrency(s.amount)}</td>
                <td><span className={`pill ${s.status === 'Paid' ? 'pill-green' : 'pill-red'}`}>{s.status}</span></td>
                {isAccountant && (
                  <td>
                    {s.status === 'Unpaid' ? (
                      <button onClick={() => handleMarkPaid(s.id)} style={{ background: 'rgba(74,222,128,0.1)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '4px', fontSize: '0.6rem', padding: '3px 6px', cursor: 'pointer', fontWeight: 600 }}>Pay Employee</button>
                    ) : ( <span style={{ color: 'var(--text-4)', fontSize: '0.65rem' }}>Done</span> )}
                  </td>
                )}
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  );


  // -------------------------------------------------------------
  // VIEW 2: ACCOUNTANT (ONLY SALARIES)
  // -------------------------------------------------------------
  if (isAccountant) {
    return (
      <div style={{ padding: '1.75rem 2rem', paddingBottom: '5rem' }} className="fade-up">
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-1)' }}>Accountant Console</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '3px' }}>Book and process employee salaries</div>
        </div>

        {/* Employee Salary Input Profile */}
        <div className="card" style={{ padding: '1.25rem', border: '1px solid rgba(74,222,128,0.2)', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4ADE80', marginBottom: '1rem', textTransform: 'uppercase' }}>+ Book Employee Salary</h3>
          <form onSubmit={handleAddSalary} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)', gap: '10px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--text-3)', paddingLeft: '4px' }}>Select Employee</label>
              <select required className="field" value={sEmail} onChange={e=>setSEmail(e.target.value)}>
                <option value="" disabled>Search existing members...</option>
                {MOCK_USERS.map(u => <option key={u.email} value={u.email}>{u.name} — {u.designation} ({u.role})</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.65rem', color: 'var(--text-3)', paddingLeft: '4px' }}>Month</label>
              <select required className="field" value={sMonth} onChange={e=>setSMonth(e.target.value)}>
                {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.65rem', color: 'var(--text-3)', paddingLeft: '4px' }}>Year</label>
              <select required className="field" value={sYear} onChange={e=>setSYear(e.target.value)}>
                <option>2025</option><option>2026</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.65rem', color: 'var(--text-3)', paddingLeft: '4px' }}>Status</label>
              <select className="field" value={sStatus} onChange={e=>setSStatus(e.target.value)}>
                <option value="Unpaid">Unpaid</option><option value="Paid">Automatically Mark as Paid</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--text-3)', paddingLeft: '4px' }}>Salary Amount (₹)</label>
              <input type="number" required className="field" placeholder="ex. 120000" value={sAmt} onChange={e=>setSAmt(e.target.value)} />
            </div>
            <button type="submit" style={{ gridColumn: '1 / -1', padding: '10px', background: '#4ADE80', color: '#000', borderRadius: '5px', fontWeight: 700, border: 'none', cursor: 'pointer', marginTop: '10px' }}>Register Salary Record</button>
          </form>
        </div>

        <SalaryTable />
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 3: ADMIN (ANALYTICS + READ-ONLY SALARIES)
  // -------------------------------------------------------------
  return (
    <div style={{ padding: '1.75rem 2rem', paddingBottom: '5rem' }} className="fade-up">
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-1)' }}>Global Finance & Analytics</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '3px' }}>Monitor company revenue and track overall expenses</div>
        </div>
      </div>

      {/* Admin Monthly Revenue Input */}
      <div className="card" style={{ padding: '1.25rem', border: '1px solid rgba(240,180,41,0.2)', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gold)', marginBottom: '1rem', textTransform: 'uppercase' }}>+ Book Overall Company Revenue</h3>
        <form onSubmit={handleAddFinance} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)', gap: '10px' }}>
          <div>
            <label style={{ fontSize: '0.65rem', color: 'var(--text-3)', paddingLeft: '4px' }}>Month</label>
            <select required className="field" value={fMonth} onChange={e=>setFMonth(e.target.value)}>
              {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
             <label style={{ fontSize: '0.65rem', color: 'var(--text-3)', paddingLeft: '4px' }}>Year</label>
            <select required className="field" value={fYear} onChange={e=>setFYear(e.target.value)}>
              <option>2025</option><option>2026</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.65rem', color: 'var(--text-3)', paddingLeft: '4px' }}>Total Monthly Revenue (₹)</label>
            <input type="number" required className="field" placeholder="ex. 1500000" value={fRev} onChange={e=>setFRev(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: '0.65rem', color: 'var(--text-3)', paddingLeft: '4px' }}>Total Monthly Expenses (₹)</label>
            <input type="number" required className="field" placeholder="ex. 500000" value={fExp} onChange={e=>setFExp(e.target.value)} />
          </div>
          <button type="submit" style={{ gridColumn: '1 / -1', padding: '8px', background: 'var(--gold)', color: '#000', borderRadius: '5px', fontWeight: 700, border: 'none', cursor: 'pointer', marginTop: '10px' }}>Save Financials</button>
        </form>
      </div>

      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4ADE80' }}>{formatCurrency(totalRevenue)}</div>
          <div><div style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-2)' }}>YTD Revenue</div></div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F87171' }}>{formatCurrency(totalExpenses)}</div>
          <div><div style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-2)' }}>YTD Expenses</div></div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F0B429' }}>{formatCurrency(totalProfit)}</div>
          <div><div style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-2)' }}>Net Profit</div></div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: momGrowth >= 0 ? '#4ADE80' : '#F87171' }}>{momGrowth > 0 ? '+' : ''}{momGrowth}%</div>
          <div><div style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-2)' }}>MoM Growth</div></div>
        </div>
      </div>

      {finances.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: '1rem' }}>Monthly Revenue</div>
            <div style={{ width: '100%', height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={processedFinances}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-3)' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-3)' }} tickFormatter={v => `₹${v/100000}L`} />
                  <Tooltip contentStyle={{ backgroundColor: '#05100C', borderColor: 'var(--bg-border)' }} formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="revenue" fill="#F0B429" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: '1rem' }}>Net Profit Trend</div>
            <div style={{ width: '100%', height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={processedFinances}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-3)' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-3)' }} tickFormatter={v => `₹${v/100000}L`} />
                  <Tooltip contentStyle={{ backgroundColor: '#05100C', borderColor: 'var(--bg-border)' }} formatter={(v: number) => formatCurrency(v)} />
                  <Line type="monotone" dataKey="profit" stroke="#4ADE80" strokeWidth={3} dot={{ r: 4, fill: '#05100C', stroke: '#4ADE80', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Salary & Monthly Output Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <SalaryTable />

        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={18} color="var(--gold)" /> Monthly Finances</span>
            <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--bg-border)', color: 'var(--text-2)', fontSize: '0.72rem', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>
              <Download size={13} /> Export CSV
            </button>
          </h2>
          <div className="card" style={{ height: '350px', overflowY: 'auto' }}>
            <table className="tbl">
              <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-surface)' }}>
                <tr><th>Month</th><th>Revenue</th><th>Expenses</th><th>Margin</th></tr>
              </thead>
              <tbody>
                {processedFinances.length === 0 ? <tr><td colSpan={4} style={{textAlign:'center', color:'var(--text-4)', padding:'2rem'}}>No revenue inputs.</td></tr> : processedFinances.map(f => (
                  <tr key={f.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-2)' }}>{f.month}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-1)' }}>{formatCurrency(f.revenue)}</td>
                    <td style={{ fontSize: '0.75rem', color: '#F87171' }}>{formatCurrency(f.expenses)}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{f.margin}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
