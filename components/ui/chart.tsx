'use client'

import * as React from 'react'
import * as RechartsPrimitive from 'recharts'
import { cn } from '@/lib/utils'

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: '', dark: '.dark' } as const

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />')
  }
  return context
}

// ===========================================================
// 🧩 ChartContainer
// ===========================================================
function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<'div'> & {
  config: ChartConfig
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >['children']
}) {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, '')}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border flex aspect-video justify-center text-xs [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

// ===========================================================
// 🎨 ChartStyle
// ===========================================================
const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, conf]) => conf.theme || conf.color
  )

  if (!colorConfig.length) return null

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color
    return color ? `  --color-${key}: ${color};` : ''
  })
  .join('\n')}
}
`
          )
          .join('\n'),
      }}
    />
  )
}

// ===========================================================
// 🧠 Tooltip + Legend Interfaces
// ===========================================================
interface TooltipPayloadItem {
  name?: string
  value?: number
  color?: string
  dataKey?: string
  payload?: any
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string | number
  className?: string
  indicator?: 'line' | 'dot' | 'dashed'
  hideLabel?: boolean
  hideIndicator?: boolean
  labelFormatter?: (
    label: string | number,
    payload?: TooltipPayloadItem[]
  ) => React.ReactNode
  labelClassName?: string
  formatter?: (
    value: number,
    name: string,
    item: TooltipPayloadItem,
    index: number,
    fullPayload: any
  ) => React.ReactNode
  color?: string
  nameKey?: string
  labelKey?: string
}

interface CustomLegendProps {
  className?: string
  hideIcon?: boolean
  payload?: { color?: string; value?: string; dataKey?: string }[]
  verticalAlign?: 'top' | 'bottom'
  nameKey?: string
}

// ===========================================================
// 📊 ChartTooltip
// ===========================================================
const ChartTooltip = RechartsPrimitive.Tooltip

function ChartTooltipContent({
  active,
  payload,
  label,
  className,
  indicator = 'dot',
  hideLabel = false,
  hideIndicator = false,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
}: CustomTooltipProps) {
  const { config } = useChart()

  if (!active || !Array.isArray(payload) || payload.length === 0) return null

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) return null
    const [item] = payload
    const key = `${labelKey || item?.dataKey || item?.name || 'value'}`
    const itemConfig = getPayloadConfigFromPayload(config, item, key)
    const value =
      !labelKey && typeof label === 'string'
        ? config[label as keyof typeof config]?.label || label
        : itemConfig?.label

   if (labelFormatter) {
  return (
    <div className={cn('font-medium', labelClassName)}>
      {labelFormatter(String(value ?? ''), payload as TooltipPayloadItem[])}
    </div>
  )
}


    if (!value) return null
    return <div className={cn('font-medium', labelClassName)}>{value}</div>
  }, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey])

  return (
    <div
      className={cn(
        'border-border/50 bg-background grid min-w-[8rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl',
        className
      )}
    >
      {tooltipLabel}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const key = `${nameKey || item.name || item.dataKey || 'value'}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)
          const indicatorColor = color || item.payload?.fill || item.color

          return (
            <div
              key={key}
              className={cn(
                'flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground',
                indicator === 'dot' && 'items-center'
              )}
            >
              {!hideIndicator && (
                <div
                  className="h-2.5 w-2.5 rounded-[2px]"
                  style={{
                    backgroundColor: indicatorColor,
                    borderColor: indicatorColor,
                  }}
                />
              )}
              <div className="flex flex-1 justify-between leading-none items-center">
                <span>{itemConfig?.label || item.name}</span>
                <span className="font-mono font-medium tabular-nums">
                  {item.value?.toLocaleString?.() ?? 0}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ===========================================================
// 🧾 ChartLegend
// ===========================================================
const ChartLegend = RechartsPrimitive.Legend

function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
  verticalAlign = 'bottom',
  nameKey,
}: CustomLegendProps) {
  const { config } = useChart()

  if (!Array.isArray(payload) || payload.length === 0) return null

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-4',
        verticalAlign === 'top' ? 'pb-3' : 'pt-3',
        className
      )}
    >
      {payload.map((item, index) => {
        const key = `${nameKey || item.dataKey || 'value'}-${index}`
        const itemConfig = getPayloadConfigFromPayload(config, item, key)

        return (
          <div
            key={key}
            className="flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
          >
            {!hideIcon && (
              <div
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{
                  backgroundColor: item.color,
                }}
              />
            )}
            <span>{itemConfig?.label || item.value}</span>
          </div>
        )
      })}
    </div>
  )
}

// ===========================================================
// ⚙️ Helper: Payload Config
// ===========================================================
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (typeof payload !== 'object' || payload === null) return undefined

  const payloadPayload =
    'payload' in (payload as any) &&
    typeof (payload as any).payload === 'object' &&
    (payload as any).payload !== null
      ? (payload as any).payload
      : undefined

  let configLabelKey: string = key

  if (
    key in (payload as any) &&
    typeof (payload as any)[key] === 'string'
  ) {
    configLabelKey = (payload as any)[key]
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key] === 'string'
  ) {
    configLabelKey = payloadPayload[key]
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config]
}

// ===========================================================
// 🚀 Exports
// ===========================================================
export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
}
