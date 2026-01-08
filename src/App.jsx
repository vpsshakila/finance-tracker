import React, { useState, useEffect } from "react";
import {
  FaMoneyBillWave,
  FaShoppingCart,
  FaCalendarAlt,
  FaStore,
  FaChartLine,
  FaSync,
  FaFilter,
  FaTimes,
  FaChartBar,
  FaChartPie,
  FaTags,
  FaCalendar,
  FaFire,
} from "react-icons/fa";

// Service untuk fetch data dari Google Sheets
const fetchSheetData = async (apiKey, spreadsheetId, sheetName) => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}?key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.values && data.values.length > 1) {
      const headers = data.values[0];
      const rows = data.values.slice(1);

      return rows.map((row) => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] || "";
        });
        return obj;
      });
    }
    return [];
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};

// Fungsi untuk format rupiah - TIDAK DISINGKAT
const formatRupiah = (amount) => {
  if (!amount) return "Rp 0";
  const numStr = amount.toString().replace(/[^0-9]/g, "");
  const num = parseInt(numStr);
  return "Rp " + num.toLocaleString("id-ID");
};

// Fungsi untuk format tanggal
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const [year, month, day] = dateStr.split("-");
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// Fungsi untuk mendapatkan tanggal dari string
const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split("-");
  return new Date(year, month - 1, day);
};

// Fungsi untuk format tanggal lengkap dengan hari
const formatFullDate = (dateStr) => {
  if (!dateStr) return "-";
  const [year, month, day] = dateStr.split("-");
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// Komponen ProgressBar
const ProgressBar = ({ percentage, color, label, amount }) => (
  <div className="mb-4">
    <div className="flex justify-between mb-1">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <span className="text-sm font-bold text-gray-700">{amount}</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div
        className={`h-2.5 rounded-full ${color}`}
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  </div>
);

// Komponen untuk tabel kategori
const CategoryTable = ({
  categories,
  title,
  icon,
  color,
  isIncome = false,
}) => (
  <div className="bg-white rounded-xl p-4 shadow-md">
    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
      {icon}
      {title}
    </h4>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-2 text-gray-600 font-medium">No</th>
            <th className="text-left py-2 text-gray-600 font-medium">
              Kategori
            </th>
            <th className="text-right py-2 text-gray-600 font-medium">Total</th>
            <th className="text-right py-2 text-gray-600 font-medium">
              Jumlah
            </th>
          </tr>
        </thead>
        <tbody>
          {categories.length > 0 ? (
            categories.map((category, index) => (
              <tr
                key={category.category}
                className="border-b border-gray-50 hover:bg-gray-50"
              >
                <td className="py-2 font-medium text-gray-500">{index + 1}</td>
                <td className="py-2 font-medium text-gray-700">
                  {category.category}
                </td>
                <td
                  className={`py-2 text-right font-medium ${
                    isIncome ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {formatRupiah(category.total)}
                </td>
                <td className="py-2 text-right text-gray-700 font-medium">
                  {category.count}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="py-4 text-center text-gray-400">
                Tidak ada data
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

// Tab untuk statistik
const StatisticsTab = ({ transactions, selectedPeriod, setSelectedPeriod }) => {
  // Get current month in YYYY-MM format
  const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    return `${year}-${month}`;
  };

  // Get available months from transactions
  const getAvailableMonths = () => {
    const monthsSet = new Set();
    transactions.forEach((transaction) => {
      const date = parseDate(transaction["Tanggal Struk"]);
      if (date) {
        const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1)
          .toString()
          .padStart(2, "0")}`;
        monthsSet.add(monthYear);
      }
    });
    return Array.from(monthsSet).sort().reverse();
  };

  const availableMonths = getAvailableMonths();
  const currentMonth = getCurrentMonth();

  // Set default to current month if available, otherwise "all"
  useEffect(() => {
    if (!selectedPeriod) {
      if (availableMonths.includes(currentMonth)) {
        setSelectedPeriod(currentMonth);
      } else if (availableMonths.length > 0) {
        setSelectedPeriod(availableMonths[0]);
      } else {
        setSelectedPeriod("all");
      }
    }
  }, [availableMonths, currentMonth, selectedPeriod, setSelectedPeriod]);

  // Filter transactions based on selected period
  const getFilteredTransactions = () => {
    if (selectedPeriod === "all") {
      return transactions;
    }

    return transactions.filter((transaction) => {
      const date = parseDate(transaction["Tanggal Struk"]);
      if (!date) return false;
      const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;
      return monthYear === selectedPeriod;
    });
  };

  const filteredTransactions = getFilteredTransactions();

  // Calculate statistics by category - Dipisah menjadi income dan expense
  const calculateCategoryStats = () => {
    const incomeCategories = {};
    const expenseCategories = {};

    filteredTransactions.forEach((transaction) => {
      const category = transaction.Kategori || "Lainnya";
      const amount = parseInt(
        (transaction.Total || "0").toString().replace(/[^0-9]/g, "")
      );
      const type = transaction.Jenis;

      if (type === "Income") {
        if (!incomeCategories[category]) {
          incomeCategories[category] = {
            total: 0,
            count: 0,
          };
        }
        incomeCategories[category].total += amount;
        incomeCategories[category].count++;
      } else {
        if (!expenseCategories[category]) {
          expenseCategories[category] = {
            total: 0,
            count: 0,
          };
        }
        expenseCategories[category].total += amount;
        expenseCategories[category].count++;
      }
    });

    // Urutkan dari yang terbesar ke terkecil
    const sortedIncomeCategories = Object.entries(incomeCategories)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([category, stats]) => ({ category, ...stats }));

    const sortedExpenseCategories = Object.entries(expenseCategories)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([category, stats]) => ({ category, ...stats }));

    return {
      income: sortedIncomeCategories,
      expense: sortedExpenseCategories,
    };
  };

  const categoryStats = calculateCategoryStats();

  // Get highest EXPENSE transaction (not income)
  const expenseTransactions = filteredTransactions.filter(
    (t) => t.Jenis === "Expense"
  );
  const highestExpenseTransaction =
    expenseTransactions.length > 0
      ? expenseTransactions.reduce((max, current) => {
          const currentAmount = parseInt(
            (current.Total || "0").toString().replace(/[^0-9]/g, "")
          );
          const maxAmount = parseInt(
            (max.Total || "0").toString().replace(/[^0-9]/g, "")
          );
          return currentAmount > maxAmount ? current : max;
        })
      : null;

  // Get top categories (by expense) untuk progress bar
  const topExpenseCategories = categoryStats.expense.slice(0, 5);
  const totalExpense = categoryStats.expense.reduce(
    (sum, category) => sum + category.total,
    0
  );

  // Calculate transaction frequency and get most active day with full date
  const transactionsByDate = {};
  let mostActiveDate = null;
  let maxTransactions = 0;

  filteredTransactions.forEach((transaction) => {
    const dateStr = transaction["Tanggal Struk"];
    if (dateStr) {
      transactionsByDate[dateStr] = (transactionsByDate[dateStr] || 0) + 1;

      if (transactionsByDate[dateStr] > maxTransactions) {
        maxTransactions = transactionsByDate[dateStr];
        mostActiveDate = dateStr;
      }
    }
  });

  // Format period text
  const getPeriodText = () => {
    if (selectedPeriod === "all") {
      return "Semua Periode";
    }
    const [year, month] = selectedPeriod.split("-");
    const monthName = new Date(year, month - 1).toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric",
    });
    return `${monthName}`;
  };

  return (
    <div className="space-y-4">
      {/* Period Selector */}
      <div className="bg-white rounded-xl p-4 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <p className="font-bold text-sm text-gray-800 flex items-center gap-2">
            <FaCalendar />
            {getPeriodText()}
          </p>
          <select
            value={selectedPeriod || ""}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">📊 Semua Periode</option>
            {availableMonths.map((month) => {
              const [year, monthNum] = month.split("-");
              const monthName = new Date(year, monthNum - 1).toLocaleDateString(
                "id-ID",
                { month: "long", year: "numeric" }
              );
              return (
                <option key={month} value={month}>
                  {monthName}
                </option>
              );
            })}
          </select>
        </div>

        {/* Top Expense Transaction Card */}
        {highestExpenseTransaction && (
          <div className="mb-6 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-4 border border-orange-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                <FaFire className="text-orange-500" />
                Pengeluaran Tertinggi
              </h4>
              <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded">
                TERBESAR
              </span>
            </div>
            <div className="bg-white rounded-lg p-3 border border-orange-200">
              <div className="flex justify-between items-center mb-2">
                <div className="flex-1">
                  <p className="font-bold text-gray-800 text-sm truncate">
                    {highestExpenseTransaction.Items}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {highestExpenseTransaction.Kategori || "Lainnya"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-orange-600">
                    {formatRupiah(highestExpenseTransaction.Total)}
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1 text-gray-500 text-xs">
                  <FaStore className="text-xs" />
                  <span>{highestExpenseTransaction.Toko || "-"}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-500 text-xs">
                  <FaCalendarAlt className="text-xs" />
                  <span>
                    {formatDate(highestExpenseTransaction["Tanggal Struk"])}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Most Active Day with Full Date */}
        {mostActiveDate && maxTransactions > 0 && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
            <h4 className="font-bold text-sm text-gray-800 mb-2">
              Hari Transaksi Terbanyak
            </h4>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-600 mb-1">
                  {formatFullDate(mostActiveDate)}
                </p>
                <p className="text-gray-600 text-sm">
                  {maxTransactions} transaksi pada hari ini
                </p>
              </div>
              <div className="bg-blue-100 text-blue-800 text-xl font-bold px-3 py-2 rounded-lg">
                {maxTransactions}
              </div>
            </div>
          </div>
        )}

        {/* Category Breakdown */}
        <div className="mb-6">
          <h4 className="font-bold text-sm text-gray-800 mb-3 flex items-center gap-2">
            <FaTags />
            Top 5 Kategori Pengeluaran
          </h4>
          {topExpenseCategories.length > 0 ? (
            <div className="space-y-3">
              {topExpenseCategories.map((category, index) => {
                const percentage =
                  totalExpense > 0 ? (category.total / totalExpense) * 100 : 0;
                const colors = [
                  "bg-red-500",
                  "bg-orange-500",
                  "bg-yellow-500",
                  "bg-green-500",
                  "bg-blue-500",
                ];

                return (
                  <ProgressBar
                    key={category.category}
                    percentage={percentage}
                    color={colors[index]}
                    label={category.category}
                    amount={formatRupiah(category.total)}
                  />
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">
              Tidak ada data pengeluaran
            </p>
          )}
        </div>
      </div>

      {/* Income Categories Table */}
      <CategoryTable
        categories={categoryStats.income}
        title="Kategori Pemasukan"
        icon={<FaMoneyBillWave className="text-green-500" />}
        color="green"
        isIncome={true}
      />

      {/* Expense Categories Table */}
      <CategoryTable
        categories={categoryStats.expense}
        title="Kategori Pengeluaran"
        icon={<FaShoppingCart className="text-red-500" />}
        color="red"
        isIncome={false}
      />
    </div>
  );
};

function App() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("month");
  const [customDate, setCustomDate] = useState("");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [activeTab, setActiveTab] = useState("transactions");
  const [selectedPeriod, setSelectedPeriod] = useState("");

  const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
  const SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID;
  const SHEET_NAME = import.meta.env.VITE_SHEET_NAME;

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSheetData(API_KEY, SPREADSHEET_ID, SHEET_NAME);
      setTransactions(data);
    } catch (err) {
      setError(
        "Gagal memuat data. Pastikan API Key dan Spreadsheet ID sudah benar."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter transactions berdasarkan tanggal
  const filterByDate = (transaction) => {
    const tranDate = parseDate(transaction["Tanggal Struk"]);
    if (!tranDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (dateFilter) {
      case "today":
        const tranDateOnly = new Date(tranDate);
        tranDateOnly.setHours(0, 0, 0, 0);
        return tranDateOnly.getTime() === today.getTime();

      case "week":
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        return tranDate >= weekAgo && tranDate <= today;

      case "month":
        return (
          tranDate.getMonth() === today.getMonth() &&
          tranDate.getFullYear() === today.getFullYear()
        );

      case "custom":
        if (!customDate) return true;
        const selectedDate = new Date(customDate);
        selectedDate.setHours(0, 0, 0, 0);
        const tranDateCheck = new Date(tranDate);
        tranDateCheck.setHours(0, 0, 0, 0);
        return tranDateCheck.getTime() === selectedDate.getTime();

      default:
        return true;
    }
  };

  // Filter transactions
  const filteredTransactions = transactions
    .filter((t) => {
      if (typeFilter === "income" && t.Jenis !== "Income") return false;
      if (typeFilter === "expense" && t.Jenis !== "Expense") return false;
      return filterByDate(t);
    })
    .reverse();

  // Calculate summary untuk tab transaksi
  const summary = filteredTransactions.reduce(
    (acc, t) => {
      const amount = parseInt(
        (t.Total || "0").toString().replace(/[^0-9]/g, "")
      );
      if (t.Jenis === "Income") {
        acc.income += amount;
      } else {
        acc.expense += amount;
      }
      return acc;
    },
    { income: 0, expense: 0 }
  );

  const balance = summary.income - summary.expense;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <FaSync className="animate-spin text-5xl text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
          <div className="bg-red-100 rounded-xl p-4 mb-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <button
            onClick={loadData}
            className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl w-full font-semibold shadow-lg hover:shadow-xl transition"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const dateFilterText = {
    all: "Semua",
    today: "Hari Ini",
    week: "Minggu Ini",
    month: "Bulan Ini",
    custom: customDate ? formatDate(customDate) : "Pilih Tanggal",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white px-4 pt-2 pb-4 shadow-xl">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h1 className="text-xl font-bold mb-0.5">Data Keuangan</h1>
              <div className="flex text-sm text-blue-100 font-medium gap-2">
                {activeTab === "transactions" ? (
                  <>
                    <p>{dateFilterText[dateFilter]}</p>
                    <p> - {filteredTransactions.length} Transaksi</p>
                  </>
                ) : (
                  <p>Statistik Lengkap</p>
                )}
              </div>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="bg-white/20 backdrop-blur-sm p-2 rounded-lg hover:bg-white/30 transition shadow-lg"
              >
                <FaFilter className="text-sm" />
              </button>
              <button
                onClick={loadData}
                className="bg-white/20 backdrop-blur-sm p-2 rounded-lg hover:bg-white/30 transition shadow-lg"
              >
                <FaSync className="text-sm" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-white/10 backdrop-blur-md rounded-xl p-1 mb-3 border border-white/20">
            <button
              onClick={() => setActiveTab("transactions")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === "transactions"
                  ? "bg-white text-blue-700 shadow-md"
                  : "text-white/80 hover:text-white"
              }`}
            >
              <FaShoppingCart className="inline-block mr-2" />
              Transaksi
            </button>
            <button
              onClick={() => setActiveTab("statistics")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === "statistics"
                  ? "bg-white text-blue-700 shadow-md"
                  : "text-white/80 hover:text-white"
              }`}
            >
              <FaChartPie className="inline-block mr-2" />
              Statistik
            </button>
          </div>

          {/* Balance Card - Hanya tampil di tab transaksi */}
          {activeTab === "transactions" && (
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 shadow-lg border border-white/20">
              <p className="text-blue-100 text-xs mb-1">Total Saldo</p>
              <p
                className={`text-xl font-bold mb-2 ${
                  balance >= 0 ? "text-white" : "text-red-400"
                }`}
              >
                {balance >= 0 ? "+" : "-"} {formatRupiah(Math.abs(balance))}
              </p>

              <div className="grid grid-cols-2 gap-1.5">
                <div className="bg-green-500/50 backdrop-blur-sm rounded-lg p-1.5 border border-green-400/30">
                  <p className="text-green-100 text-xs mb-0.5">Pemasukan</p>
                  <p className="text-white font-bold text-xs">
                    {formatRupiah(summary.income)}
                  </p>
                </div>
                <div className="bg-red-500/50 backdrop-blur-sm rounded-lg p-1.5 border border-red-400/30">
                  <p className="text-red-100 text-xs mb-0.5">Pengeluaran</p>
                  <p className="text-white font-bold text-xs">
                    {formatRupiah(summary.expense)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter Menu Modal */}
      {showFilterMenu && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end"
          onClick={() => setShowFilterMenu(false)}
        >
          <div
            className="bg-white rounded-t-3xl w-full max-w-md mx-auto p-6 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-bold text-gray-800">
                Filter Transaksi
              </h3>
              <button
                onClick={() => setShowFilterMenu(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            {/* Type Filter */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 mb-2">Jenis</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setTypeFilter("all")}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                    typeFilter === "all"
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setTypeFilter("income")}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                    typeFilter === "income"
                      ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  Masuk
                </button>
                <button
                  onClick={() => setTypeFilter("expense")}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                    typeFilter === "expense"
                      ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  Keluar
                </button>
              </div>
            </div>

            {/* Date Filter */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 mb-2">
                Periode
              </p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  onClick={() => {
                    setDateFilter("all");
                    setCustomDate("");
                  }}
                  className={`py-2 rounded-lg text-xs font-medium transition ${
                    dateFilter === "all"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-50 text-gray-600"
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => {
                    setDateFilter("today");
                    setCustomDate("");
                  }}
                  className={`py-2 rounded-lg text-xs font-medium transition ${
                    dateFilter === "today"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-50 text-gray-600"
                  }`}
                >
                  Hari Ini
                </button>
                <button
                  onClick={() => {
                    setDateFilter("week");
                    setCustomDate("");
                  }}
                  className={`py-2 rounded-lg text-xs font-medium transition ${
                    dateFilter === "week"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-50 text-gray-600"
                  }`}
                >
                  Minggu Ini
                </button>
                <button
                  onClick={() => {
                    setDateFilter("month");
                    setCustomDate("");
                  }}
                  className={`py-2 rounded-lg text-xs font-medium transition ${
                    dateFilter === "month"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-50 text-gray-600"
                  }`}
                >
                  Bulan Ini
                </button>
              </div>

              {/* Date Picker */}
              <div className="mt-3">
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Pilih Tanggal Spesifik
                </label>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => {
                    setCustomDate(e.target.value);
                    setDateFilter("custom");
                  }}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  placeholder="Pilih tanggal"
                />
              </div>
            </div>

            <button
              onClick={() => setShowFilterMenu(false)}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition"
            >
              Terapkan Filter
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-md mx-auto px-2 py-4">
        {activeTab === "transactions" ? (
          /* Transactions List */
          <div className="space-y-3">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-white rounded-2xl p-8 shadow-lg">
                  <FaChartLine className="text-5xl mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-400 font-medium">
                    Tidak ada transaksi
                  </p>
                  <p className="text-gray-300 text-sm mt-1">di periode ini</p>
                </div>
              </div>
            ) : (
              filteredTransactions.map((transaction, index) => {
                const amount = parseInt(
                  (transaction.Total || "0").toString().replace(/[^0-9]/g, "")
                );
                const isIncome = transaction.Jenis === "Income";

                return (
                  <div
                    key={index}
                    className="bg-white rounded-xl shadow-md hover:shadow-lg transition overflow-hidden"
                  >
                    <div
                      className={`h-1 ${
                        isIncome
                          ? "bg-gradient-to-r from-green-400 to-green-500"
                          : "bg-gradient-to-r from-red-400 to-red-500"
                      }`}
                    />

                    <div className="px-3 py-2">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <div
                              className={`p-1.5 rounded-lg ${
                                isIncome ? "bg-green-100" : "bg-red-100"
                              }`}
                            >
                              {isIncome ? (
                                <FaMoneyBillWave className="text-green-600 text-xs" />
                              ) : (
                                <FaShoppingCart className="text-red-600 text-xs" />
                              )}
                            </div>
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded ${
                                isIncome
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {transaction.Jenis}
                            </span>
                            {transaction.Kategori && (
                              <p className="text-xs text-gray-500 bg-gray-50 inline-block px-2 py-0.5 rounded truncate max-w-27">
                                {transaction.Kategori}
                              </p>
                            )}
                          </div>
                          <h3 className="font-semibold text-gray-800 text-sm mb-1">
                            {transaction.Items}
                          </h3>
                        </div>
                        <div className="text-right ml-3">
                          <p
                            className={`font-bold text-base ${
                              isIncome ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {isIncome ? "+" : "-"} {formatRupiah(amount)}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-1 text-gray-500">
                          <FaStore className="text-xs" />
                          <span className="text-xs font-medium">
                            {transaction.Toko || "-"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <FaCalendarAlt className="text-xs" />
                          <span className="text-xs font-medium">
                            {formatDate(transaction["Tanggal Struk"])}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* Statistics Tab */
          <StatisticsTab
            transactions={transactions}
            selectedPeriod={selectedPeriod}
            setSelectedPeriod={setSelectedPeriod}
          />
        )}
      </div>
    </div>
  );
}

export default App;
