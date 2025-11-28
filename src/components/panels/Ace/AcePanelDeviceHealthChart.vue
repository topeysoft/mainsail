<template>
    <div class="health-chart-container">
        <svg :width="width" :height="height" class="health-sparkline">
            <!-- Background grid lines -->
            <line
                v-for="i in gridLines"
                :key="`grid-${i}`"
                :x1="0"
                :y1="(height / gridLines) * i"
                :x2="width"
                :y2="(height / gridLines) * i"
                stroke="rgba(128, 128, 128, 0.1)"
                stroke-width="1" />

            <!-- Sparkline path -->
            <path
                :d="sparklinePath"
                fill="none"
                :stroke="lineColor"
                :stroke-width="strokeWidth"
                stroke-linecap="round"
                stroke-linejoin="round" />

            <!-- Fill area under the line -->
            <path
                v-if="showFill"
                :d="fillPath"
                :fill="fillGradientId"
                opacity="0.3" />

            <!-- Data points -->
            <circle
                v-for="(point, index) in points"
                :key="`point-${index}`"
                :cx="point.x"
                :cy="point.y"
                :r="pointRadius"
                :fill="getPointColor(dataPoints[index])"
                :opacity="showPoints ? 1 : 0"
                class="data-point">
                <title>{{ formatTooltip(dataPoints[index], index) }}</title>
            </circle>

            <!-- Gradient definition for fill -->
            <defs>
                <linearGradient :id="gradientId" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" :stop-color="lineColor" stop-opacity="0.5" />
                    <stop offset="100%" :stop-color="lineColor" stop-opacity="0" />
                </linearGradient>
            </defs>
        </svg>

        <!-- Chart legend/label -->
        <div v-if="label" class="chart-label text-caption text--secondary">
            {{ label }}
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

export interface DataPoint {
    value: number
    timestamp?: number
    label?: string
}

@Component
export default class AcePanelDeviceHealthChart extends Vue {
    @Prop({ type: Array, required: true }) readonly data!: number[] | DataPoint[]
    @Prop({ type: Number, default: 100 }) readonly width!: number
    @Prop({ type: Number, default: 30 }) readonly height!: number
    @Prop({ type: String, default: '#4CAF50' }) readonly color!: string
    @Prop({ type: Number, default: 2 }) readonly strokeWidth!: number
    @Prop({ type: Number, default: 2 }) readonly pointRadius!: number
    @Prop({ type: Boolean, default: true }) readonly showFill!: boolean
    @Prop({ type: Boolean, default: false }) readonly showPoints!: boolean
    @Prop({ type: Number, default: 3 }) readonly gridLines!: number
    @Prop({ type: String, default: '' }) readonly label!: string
    @Prop({ type: String, default: 'value' }) readonly type!: 'value' | 'error' | 'temperature' | 'response_time'

    get gradientId(): string {
        return `gradient-${this._uid}`
    }

    get fillGradientId(): string {
        return `url(#${this.gradientId})`
    }

    get dataPoints(): DataPoint[] {
        return this.data.map((d) => {
            if (typeof d === 'number') {
                return { value: d }
            }
            return d
        })
    }

    get normalizedData(): number[] {
        const values = this.dataPoints.map((d) => d.value)
        const max = Math.max(...values, 1)
        const min = Math.min(...values, 0)
        const range = max - min || 1

        return values.map((v) => (v - min) / range)
    }

    get points(): Array<{ x: number; y: number }> {
        const data = this.normalizedData
        const padding = 2
        const stepX = (this.width - padding * 2) / Math.max(data.length - 1, 1)
        const usableHeight = this.height - padding * 2

        return data.map((value, index) => ({
            x: padding + index * stepX,
            y: padding + usableHeight - value * usableHeight,
        }))
    }

    get sparklinePath(): string {
        if (this.points.length === 0) return ''

        const pathCommands = this.points.map((point, index) => {
            if (index === 0) {
                return `M ${point.x} ${point.y}`
            }
            return `L ${point.x} ${point.y}`
        })

        return pathCommands.join(' ')
    }

    get fillPath(): string {
        if (this.points.length === 0) return ''

        const firstPoint = this.points[0]
        const lastPoint = this.points[this.points.length - 1]

        return `
            ${this.sparklinePath}
            L ${lastPoint.x} ${this.height}
            L ${firstPoint.x} ${this.height}
            Z
        `
    }

    get lineColor(): string {
        // Auto-color based on type and severity
        if (this.color !== '#4CAF50') {
            return this.color
        }

        switch (this.type) {
            case 'error':
                return this.getErrorColor()
            case 'temperature':
                return this.getTemperatureColor()
            case 'response_time':
                return this.getResponseTimeColor()
            default:
                return this.color
        }
    }

    getErrorColor(): string {
        const maxErrors = Math.max(...this.dataPoints.map((d) => d.value))
        if (maxErrors === 0) return '#4CAF50' // Green - no errors
        if (maxErrors < 3) return '#FFC107' // Amber - few errors
        if (maxErrors < 10) return '#FF9800' // Orange - some errors
        return '#F44336' // Red - many errors
    }

    getTemperatureColor(): string {
        const avgTemp = this.dataPoints.reduce((sum, d) => sum + d.value, 0) / this.dataPoints.length
        if (avgTemp < 30) return '#2196F3' // Blue - cool
        if (avgTemp < 50) return '#4CAF50' // Green - normal
        if (avgTemp < 60) return '#FFC107' // Amber - warm
        return '#FF9800' // Orange - hot
    }

    getResponseTimeColor(): string {
        const avgResponseTime = this.dataPoints.reduce((sum, d) => sum + d.value, 0) / this.dataPoints.length
        if (avgResponseTime < 50) return '#4CAF50' // Green - fast
        if (avgResponseTime < 150) return '#FFC107' // Amber - moderate
        if (avgResponseTime < 300) return '#FF9800' // Orange - slow
        return '#F44336' // Red - very slow
    }

    getPointColor(point: DataPoint): string {
        // Color individual points based on value severity
        switch (this.type) {
            case 'error':
                if (point.value === 0) return '#4CAF50'
                if (point.value < 3) return '#FFC107'
                if (point.value < 10) return '#FF9800'
                return '#F44336'
            default:
                return this.lineColor
        }
    }

    formatTooltip(point: DataPoint, index: number): string {
        const value = point.value
        const label = point.label || `Point ${index + 1}`

        switch (this.type) {
            case 'error':
                return `${label}: ${value} error${value !== 1 ? 's' : ''}`
            case 'temperature':
                return `${label}: ${value}°C`
            case 'response_time':
                return `${label}: ${value}ms`
            default:
                return `${label}: ${value}`
        }
    }
}
</script>

<style scoped>
.health-chart-container {
    display: inline-block;
    position: relative;
}

.health-sparkline {
    display: block;
}

.data-point {
    transition: r 0.2s ease;
    cursor: pointer;
}

.data-point:hover {
    r: 4 !important;
}

.chart-label {
    text-align: center;
    margin-top: 2px;
    font-size: 0.65rem;
}
</style>
