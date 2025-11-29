import { primaryCardData, secondaryCardData } from '@/lib/constants'
import Cards from '../../_Components/Cards'

const KeyPerformanceIndicators = () => {
  return (
    <div className='flex flex-col gap-5'>
      <h2 className="text-xl font-bold">Key Performance Indicators</h2>
      {/* Primary Cards Section */}
      <div className='flex justify-between gap-3 flex-wrap'>
        {primaryCardData.map((card) => (
          <Cards key={card.id} title={card.title} metric={card.metric} icon={card.icon} change={card.change} type='primary' />
        ))}
      </div>
      <div className='flex justify-between gap-3 flex-wrap'>
        {/* Secondary Cards Section */}
        {secondaryCardData.map((card) => (
          <Cards key={card.id} title={card.title} metric={card.metric} icon={card.icon} type='secondary' />
        ))}
      </div>
    </div>
  )
}

export default KeyPerformanceIndicators
