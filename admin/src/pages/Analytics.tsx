import { TrendingUp, Users, CreditCard, Activity } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";
import API_BASE_URL from "../configs/api";

interface StatCard {
  label: string;
  value: string;
  change: number;
  icon: React.ReactNode;
}

interface AnalyticsData {
  stats: {
    totalRevenue: string;
    totalRevenueValue: number;
    revenueGrowth: number;
    activeUsers: number;
    activeUsersGrowth: number;
    subscriptions: number;
    subscriptionsGrowth: number;
    conversionRate: string;
    conversionRateGrowth: number;
  };
  charts: {
    subscriptionDistribution: Array<{ name: string; value: number; fill: string }>;
    revenueBreakdown: Array<{ name: string; value: number; fill: string }>;
  };
  summary: {
    totalRevenue: string;
    subscriptionRevenue: string;
    subscriptionRevenuePercentage: number;
    arpu: string;
    arpuGrowth: number;
  };
}

const StatCard = ({ label, value, change, icon }: StatCard) => {
  const isPositive = change >= 0;

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-white/60 text-sm mb-1">{label}</p>
          <h3 className="text-3xl font-bold text-white">{value}</h3>
        </div>
        <div className="p-3 bg-blue-500/20 rounded-lg">{icon}</div>
      </div>
      <div className="flex items-center gap-2">
        <TrendingUp
          className={`w-4 h-4 ${isPositive ? "text-green-400" : "text-red-400"}`}
        />
        <span
          className={`text-sm font-semibold ${isPositive ? "text-green-400" : "text-red-400"}`}
        >
          {isPositive ? "+" : ""}{change}% from last month
        </span>
      </div>
    </div>
  );
};

const ChartCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
      <h3 className="text-lg font-semibold text-white mb-6">{title}</h3>
      {children}
    </div>
  );
};

export default function Analytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        
        // Check if token exists before making request
        if (!token) {
          throw new Error("Authentication token not found");
        }

        const response = await fetch(`${API_BASE_URL}/api/admin/analytics`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to fetch analytics");
        }

        const data = await response.json();
        
        // Only update state if component is still mounted
        if (isMounted) {
          setAnalyticsData(data);
        }
      } catch (error) {
        // Ignore abort errors
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        console.error("Error fetching analytics:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAnalytics();

    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <p className="text-white/60">Loading analytics...</p>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <p className="text-white/60">Failed to load analytics</p>
      </div>
    );
  }

  const subscriptionData = analyticsData.charts.subscriptionDistribution;
  const revenueData = analyticsData.charts.revenueBreakdown;

  const stats: StatCard[] = [
    {
      label: "Total Revenue",
      value: analyticsData.stats.totalRevenue,
      change: analyticsData.stats.revenueGrowth,
      icon: <CreditCard className="w-6 h-6 text-blue-400" />,
    },
    {
      label: "Active Users",
      value: analyticsData.stats.activeUsers.toString(),
      change: analyticsData.stats.activeUsersGrowth,
      icon: <Users className="w-6 h-6 text-green-400" />,
    },
    {
      label: "Subscriptions",
      value: analyticsData.stats.subscriptions.toString(),
      change: analyticsData.stats.subscriptionsGrowth,
      icon: <Activity className="w-6 h-6 text-purple-400" />,
    },
    {
      label: "Conversion Rate",
      value: analyticsData.stats.conversionRate,
      change: analyticsData.stats.conversionRateGrowth,
      icon: <TrendingUp className="w-6 h-6 text-yellow-400" />,
    },
  ];

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number }>;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/10 border border-white/20 rounded-lg p-3 backdrop-blur-sm">
          <p className="text-white font-semibold">{payload[0].name}</p>
          <p className="text-white/70 text-sm">{payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex-1 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Analytics</h1>
        <p className="text-white/60">
          Track your business metrics and performance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            style={{
              animation: `slideUp 0.5s ease-out ${index * 0.1}s both`,
            }}
          >
            <StatCard {...stat} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div
          style={{
            animation: `slideUp 0.5s ease-out 0.4s both`,
          }}
        >
          <ChartCard title="Subscription Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={subscriptionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent = 0 }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {subscriptionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{
                    paddingTop: "20px",
                    color: "rgba(255, 255, 255, 0.7)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div
          style={{
            animation: `slideUp 0.5s ease-out 0.5s both`,
          }}
        >
          <ChartCard title="Revenue Breakdown">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent = 0 }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {revenueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{
                    paddingTop: "20px",
                    color: "rgba(255, 255, 255, 0.7)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      <div
        className="bg-white/5 border border-white/10 rounded-lg p-6"
        style={{
          animation: `slideUp 0.5s ease-out 0.6s both`,
        }}
      >
        <h3 className="text-lg font-semibold text-white mb-6">
          Revenue Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <p className="text-white/60 text-sm mb-2">Total Revenue</p>
            <p className="text-2xl font-bold text-green-400">{analyticsData.summary.totalRevenue}</p>
            <p className={`text-xs mt-2 ${analyticsData.stats.revenueGrowth >= 0 ? "text-green-400" : "text-red-400"}`}>
              {analyticsData.stats.revenueGrowth >= 0 ? "+" : ""}{analyticsData.stats.revenueGrowth}% from last month
            </p>
          </div>
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <p className="text-white/60 text-sm mb-2">Subscription Revenue</p>
            <p className="text-2xl font-bold text-blue-400">{analyticsData.summary.subscriptionRevenue}</p>
            <p className="text-xs text-white/50 mt-2">{analyticsData.summary.subscriptionRevenuePercentage}% of total</p>
          </div>
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <p className="text-white/60 text-sm mb-2">Average Revenue Per User</p>
            <p className="text-2xl font-bold text-purple-400">{analyticsData.summary.arpu}</p>
            <p className={`text-xs mt-2 ${analyticsData.summary.arpuGrowth >= 0 ? "text-green-400" : "text-red-400"}`}>
              {analyticsData.summary.arpuGrowth >= 0 ? "+" : ""}{analyticsData.summary.arpuGrowth}% from last month
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
