
## `/events`
### Structure
- date: date [PK]
- hour: int [PK]
- events: int
- poi_id: int [FK]

`poi_id` is the id of rows in `poi` table.
### TODO
- [x] Map Events by location
- [x] Render google maps
- [ ] Make expandable table for event dataset.
- [ ] Show markers on google maps based on number of events per location. (In Progress).
- [ ] Implement data filterering using fuzzy logic, for `date` object.