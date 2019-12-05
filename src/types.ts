export type PoiType = {
    poi_id: number,
    name: string,
    lat: number,
    lon: number
}

export type EventType = {
    date: string,
    hour: number,
    events: number,
    poi_id: number
}

export type StatType = {
    date: string,
    hour: number,
    impressions: number,
    clicks: number,
    revenue: number,
    poi_id: number
}