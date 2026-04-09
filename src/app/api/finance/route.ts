import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'finance-db.json');

function readDb() {
  if (!fs.existsSync(DB_PATH)) {
    const fresh = { finances: [], salaries: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(fresh, null, 2));
    return fresh;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function writeDb(data: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export async function GET() {
  const data = readDb();
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const db = readDb();

  if (body.type === 'ADD_FINANCE') {
    db.finances.push({
      id: Date.now().toString(),
      month: body.month,
      year: body.year,
      revenue: Number(body.revenue),
      expenses: Number(body.expenses),
      profit: Number(body.revenue) - Number(body.expenses),
      created_at: new Date().toISOString()
    });
    writeDb(db);
    return NextResponse.json(db);
  }

  if (body.type === 'ADD_SALARY') {
    db.salaries.push({
      id: Date.now().toString(),
      user_email: body.user_email,
      month: body.month,
      year: body.year,
      amount: Number(body.amount),
      status: body.status || 'Unpaid',
      paid_date: body.status === 'Paid' ? new Date().toISOString() : null,
      created_at: new Date().toISOString()
    });
    writeDb(db);
    return NextResponse.json(db);
  }

  if (body.type === 'UPDATE_SALARY_STATUS') {
    const s = db.salaries.find((x: any) => x.id === body.id);
    if (s) {
      s.status = body.status;
      if (body.status === 'Paid') s.paid_date = new Date().toISOString();
    }
    writeDb(db);
    return NextResponse.json(db);
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
