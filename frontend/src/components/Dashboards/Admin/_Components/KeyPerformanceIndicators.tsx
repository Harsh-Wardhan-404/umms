import { useEffect, useState } from 'react'
import Cards from '../../_Components/Cards'
import api from '@/lib/api'
import {
  AlertCircle,
  Box,
  ClockArrowUp,
  Layers,
  TestTubes,
  Truck,
  User,
} from "lucide-react"

interface KPIData {
  profitMargin: number
  rawMaterials: number
  lowStockAlerts: number
  activeBatches: number
  formulations: number
  systemUsers: number
}

const KeyPerformanceIndicators = () => {
  const [kpiData, setKpiData] = useState<KPIData>({
    profitMargin: 0,
    rawMaterials: 0,
    lowStockAlerts: 0,
    activeBatches: 0,
    formulations: 0,
    systemUsers: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchKPIData = async () => {
      try {
        const [
          stockRes,
          lowStockRes,
          batchStatsRes,
          formulationsRes,
          usersRes,
          profitLossRes,
        ] = await Promise.allSettled([
          api.get("/api/stock/materials?type=Raw"),
          api.get("/api/stock/alerts/low-stock"),
          api.get("/api/batch/stats/overview"),
          api.get("/api/formulation"),
          api.get("/api/user"),
          api.get("/api/profit-loss/analytics/summary"),
        ])

        const data: KPIData = {
          profitMargin: 0,
          rawMaterials: 0,
          lowStockAlerts: 0,
          activeBatches: 0,
          formulations: 0,
          systemUsers: 0,
        }

        // Raw Materials count
        if (stockRes.status === 'fulfilled') {
          data.rawMaterials = stockRes.value.data.materials?.length || 0
        }

        // Low Stock Alerts
        if (lowStockRes.status === 'fulfilled') {
          data.lowStockAlerts = lowStockRes.value.data.totalAlerts || 0
        }

        // Active Batches (InProgress status)
        if (batchStatsRes.status === 'fulfilled') {
          data.activeBatches = batchStatsRes.value.data.stats?.inProgressBatches || 0
        }

        // Formulations count
        if (formulationsRes.status === 'fulfilled') {
          data.formulations = formulationsRes.value.data.totalCount || 0
        }

        // System Users count
        if (usersRes.status === 'fulfilled') {
          data.systemUsers = usersRes.value.data.pagination?.total || usersRes.value.data.users?.length || 0
        }

        // Profit Margin from P&L summary
        if (profitLossRes.status === 'fulfilled') {
          data.profitMargin = profitLossRes.value.data.averageProfitMargin || 0
        }

        setKpiData(data)
      } catch (error) {
        console.error("Error fetching KPI data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchKPIData()
  }, [])

  if (loading) {
    return (
      <div className='flex flex-col gap-5'>
        <h2 className="text-xl font-bold">Key Performance Indicators</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading KPIs...</p>
      </div>
    )
  }

  const primaryCards = [
    { id: 1, title: "Profit Margin", metric: Math.round(kpiData.profitMargin), icon: Truck, change: undefined },
  ]

  const secondaryCards = [
    { id: 1, title: "Raw Materials", metric: kpiData.rawMaterials, icon: Box },
    { id: 2, title: "Low Stock Alerts", metric: kpiData.lowStockAlerts, icon: AlertCircle },
    { id: 3, title: "Active Batches", metric: kpiData.activeBatches, icon: Layers },
    { id: 4, title: "Formulations", metric: kpiData.formulations, icon: TestTubes },
    { id: 5, title: "System Users", metric: kpiData.systemUsers, icon: User },
  ]

  return (
    <div className='flex flex-col gap-5'>
      <h2 className="text-xl font-bold">Key Performance Indicators</h2>
      {/* Primary Cards Section */}
      {primaryCards.length > 0 && (
        <div className='flex justify-between gap-3 flex-wrap'>
          {primaryCards.map((card) => (
            <Cards key={card.id} title={card.title} metric={card.metric} icon={card.icon} change={card.change} type='primary' />
          ))}
        </div>
      )}
      {/* Secondary Cards Section */}
      {secondaryCards.length > 0 && (
        <div className='flex justify-between gap-3 flex-wrap'>
          {secondaryCards.map((card) => (
            <Cards key={card.id} title={card.title} metric={card.metric} icon={card.icon} type='secondary' />
          ))}
        </div>
      )}
    </div>
  )
}

export default KeyPerformanceIndicators
