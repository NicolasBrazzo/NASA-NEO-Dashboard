export default async function Dashboard() {
  const res = await fetch(
    "http://localhost:8000/neo/feed?start_date=2025-05-01&end_date=2025-05-07",
  );
  const data = await res.json();
  console.log(data);

  return <div>CIAO</div>;
}
