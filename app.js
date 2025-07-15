const AV_API_KEY = ' D6V7OOOO50BRF89F'; // Replace with your API key

const input = document.getElementById("stock-symbol");
const fetchBtn = document.getElementById("fetch-btn");
const canvas = document.getElementById("portfolio-canvas");
const ctx = canvas.getContext("2d");


function updateNetworkStatus() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const statusEl = document.getElementById("network-status");

  if (!connection) {
    statusEl.textContent = "Not Supported";
    return;
  }

  const speed = connection.downlink;
  statusEl.textContent = speed < 1.5 ? `Slow (${speed} Mbps)` : `Good (${speed} Mbps)`;

  if (speed < 1.5) {
    alert("⚠️ You have a slow internet connection. Avoid time-sensitive transactions.");
  }
}
updateNetworkStatus();
navigator.connection?.addEventListener("change", updateNetworkStatus);


const sections = document.querySelectorAll(".highlight-section");
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle("highlight", entry.isIntersecting);
    });
  },
  { threshold: 0.5 }
);
sections.forEach((section) => observer.observe(section));


async function fetchStockData(symbol) {
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=${AV_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  const ts = data["Time Series (Daily)"];
  if (!ts) throw new Error("Invalid symbol or API limit exceeded");

  const dates = Object.keys(ts).sort();
  const closes = dates.map((d) => parseFloat(ts[d]["4. close"]));
  const returns = [];

  for (let i = 1; i < closes.length; i++) {
    returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }

  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const stdDev = Math.sqrt(
    returns.map((r) => (r - avgReturn) ** 2).reduce((a, b) => a + b, 0) / returns.length
  );

  return { avgReturn: avgReturn * 100, risk: stdDev * 100 };
}

  async function drawPortfolio(symbol) {
  try {
    const { avgReturn, risk } = await fetchStockData(symbol);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 💡 Horizontal background bands for return zones
const returnBands = [
  { label: "Low Return", color: "#87ef10ff" },
  { label: "Medium Return", color: "#fffde7" },
  { label: "High Return", color: "#fce4ec" }
];

const bandHeight = (canvas.height - 40) / 3;

returnBands.forEach((band, i) => {
  ctx.fillStyle = band.color;
  ctx.fillRect(0, 10 + i * bandHeight, canvas.width, bandHeight);
});


    
    const marginLeft = 50;
    const marginBottom = 40;
    const maxRisk = 20;  // for scaling
    const maxReturn = 5;

    
    ctx.strokeStyle = "#eee";
    for (let i = 0; i <= maxRisk; i += 10) {
      const x = marginLeft + (i*5);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height - marginBottom);
      ctx.stroke();
    }

    for (let j = 0; j <= maxReturn; j += 5) {
      const y = canvas.height - marginBottom - (j*10);
      ctx.beginPath();
      ctx.moveTo(marginLeft, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    
    ctx.strokeStyle = "#444";
    ctx.beginPath();
    ctx.moveTo(marginLeft, 0);
    ctx.lineTo(marginLeft, canvas.height - marginBottom);
    ctx.lineTo(canvas.width, canvas.height - marginBottom);
    ctx.stroke();

    
    ctx.fillStyle = "#000";
    ctx.font = "12px sans-serif";
    ctx.fillText("Risk (%) →", canvas.width / 2, canvas.height - 10);
    ctx.save();
    ctx.translate(15, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Return (%)", 0, 0);
    ctx.restore();

    
    const plotX = marginLeft + (risk * (canvas.width - marginLeft - 20) / maxRisk);
const plotY = canvas.height - marginBottom - (avgReturn * (canvas.height - marginBottom - 20) / maxReturn); // Return ↑ Y

    
    let color = "green";
    if (risk > 30 && risk <= 45) color = "orange";
    else if (risk > 45) color = "red";

    ctx.beginPath();
    ctx.arc(plotX, plotY, 8, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();

    
    ctx.font = "13px sans-serif";
    ctx.fillStyle = "#000";
    ctx.fillText(`${symbol.toUpperCase()}`, plotX + 10, plotY - 10);
    ctx.fillText(`R: ${avgReturn.toFixed(1)}%`, plotX + 10, plotY + 5);
    ctx.fillText(`Risk: ${risk.toFixed(1)}%`, plotX + 10, plotY + 20);

  } catch (err) {
    console.error(err);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "14px sans-serif";
    ctx.fillStyle = "#f00";
    ctx.fillText("❌ Error: Invalid symbol or API limit.", 40, 150);
  }
}



fetchBtn.addEventListener("click", () => {
  const symbol = input.value.trim().toUpperCase();
  if (symbol) drawPortfolio(symbol);
});
