import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  // ===== STATES =====
  const [countries, setCountries] = useState([]);
  const [removedCountries, setRemovedCountries] = useState([]);
  const [expandedCca3, setExpandedCca3] = useState(null);

  const [converter, setConverter] = useState({
    amount: 1,
    from: "BRL",
    to: "USD",
    result: 0,
    rate: 0,
    loading: false,
    error: null,
  });

  const [darkMode, setDarkMode] = useState(false);

  // ===== DARK MODE (FIX DEFINITIVO) =====
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  // ===== FETCH COUNTRIES =====
  useEffect(() => {
    const fetchCountries = async () => {
      const initialCountries = [
        "Brazil",
        "Canada",
        "United Kingdom",
        "Portugal",
      ];

      try {
        const results = await Promise.all(
          initialCountries.map((name) =>
            fetch(`https://restcountries.com/v3.1/name/${name}`)
              .then((res) => res.json())
          )
        );

        setCountries(results.map((r) => r[0]).filter(Boolean));
      } catch (err) {
        console.error("Erro ao carregar países", err);
      }
    };

    fetchCountries();
  }, []);

  // ===== CURRENCY CONVERTER =====
  useEffect(() => {
    const convertCurrency = async () => {
      const { amount, from, to } = converter;

      if (amount <= 0) {
        setConverter((prev) => ({ ...prev, result: 0, rate: 0 }));
        return;
      }

      if (from === to) {
        setConverter((prev) => ({
          ...prev,
          result: amount,
          rate: 1,
          error: null,
        }));
        return;
      }

      setConverter((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const res = await fetch(
          `https://api.frankfurter.app/latest?amount=${amount}&from=${from}&to=${to}`
        );

        if (!res.ok) {
          throw new Error("Moeda não suportada");
        }

        const data = await res.json();

        setConverter((prev) => ({
          ...prev,
          result: data.rates[to],
          rate: data.rates[to] / amount,
          loading: false,
        }));
      } catch (err) {
        setConverter((prev) => ({
          ...prev,
          loading: false,
          error: "Conversão indisponível para esta moeda.",
        }));
      }
    };

    convertCurrency();
  }, [converter.amount, converter.from, converter.to]);

  // ===== HANDLERS =====
  const toggleDetails = (cca3) =>
    setExpandedCca3((prev) => (prev === cca3 ? null : cca3));

  const removeCountry = (cca3, e) => {
    e.stopPropagation();
    const removed = countries.find((c) => c.cca3 === cca3);

    if (removed) {
      setRemovedCountries((prev) => [...prev, removed]);
      setCountries((prev) => prev.filter((c) => c.cca3 !== cca3));
      if (expandedCca3 === cca3) setExpandedCca3(null);
    }
  };

  const restoreCountry = (cca3) => {
    const restored = removedCountries.find((c) => c.cca3 === cca3);

    if (restored) {
      setCountries((prev) => [...prev, restored]);
      setRemovedCountries((prev) => prev.filter((c) => c.cca3 !== cca3));
    }
  };

  // ===== JSX =====
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Países e suas Informações</h1>
        <button className="dark-mode-toggle" onClick={toggleDarkMode}>
          {darkMode ? "☀️ Claro" : "🌙 Escuro"}
        </button>
      </header>

      {/* COUNTRIES */}
      <div className="countries-container">
        {countries.map((country) => {
          const currencyCode = Object.keys(country.currencies || {})[0];
          const lat = country.latlng?.[0];
          const lng = country.latlng?.[1];
          const isExpanded = expandedCca3 === country.cca3;

          return (
            <div
              key={country.cca3}
              className="country-card"
              onClick={() => toggleDetails(country.cca3)}
            >
              <div className="card-header">
                <h2>{country.name.common}</h2>
                <img src={country.flags.svg} alt={country.name.common} />
              </div>

              {isExpanded && (
                <div className="country-details">
                  <p><strong>Capital:</strong> {country.capital}</p>
                  <p><strong>Região:</strong> {country.region}</p>
                  <p><strong>População:</strong> {country.population.toLocaleString()}</p>
                  <p><strong>Moeda:</strong> {currencyCode}</p>

                  {lat && lng && (
                    <iframe
                      title="map"
                      width="100%"
                      height="150"
                      loading="lazy"
                      style={{ borderRadius: "8px" }}
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng-1}%2C${lat-1}%2C${lng+1}%2C${lat+1}&marker=${lat}%2C${lng}`}
                    />
                  )}

                  <button
                    className="remove-btn"
                    onClick={(e) => removeCountry(country.cca3, e)}
                  >
                    Remover país
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* TRASH */}
      {removedCountries.length > 0 && (
        <div className="trash-section">
          <h2>Lixeira</h2>
          {removedCountries.map((c) => (
            <div key={c.cca3} className="trash-item">
              <span>{c.name.common}</span>
              <button className="restore-btn" onClick={() => restoreCountry(c.cca3)}>
                Restaurar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* CONVERTER */}
      <div className="currency-converter card-glass">
        <h2>💱 Conversor de Moeda</h2>

        <div className="converter-controls">
          <input
            type="number"
            min="0"
            value={converter.amount}
            onChange={(e) =>
              setConverter({ ...converter, amount: Number(e.target.value) })
            }
          />

          <select
            value={converter.from}
            onChange={(e) =>
              setConverter({ ...converter, from: e.target.value })
            }
          >
            <option>BRL</option>
            <option>USD</option>
            <option>EUR</option>
            <option>GBP</option>
            <option>CAD</option>
          </select>

          <span>→</span>

          <select
            value={converter.to}
            onChange={(e) =>
              setConverter({ ...converter, to: e.target.value })
            }
          >
            <option>BRL</option>
            <option>USD</option>
            <option>EUR</option>
            <option>GBP</option>
            <option>CAD</option>
          </select>
        </div>

        {converter.loading ? (
          <p>Carregando...</p>
        ) : converter.error ? (
          <p className="error">{converter.error}</p>
        ) : (
          <>
            <p className="resultado">
              {converter.amount} {converter.from} ={" "}
              <strong>{converter.result.toFixed(2)}</strong> {converter.to}
            </p>
            <p className="exchange-rate">
              Taxa: 1 {converter.from} = {converter.rate.toFixed(4)} {converter.to}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
