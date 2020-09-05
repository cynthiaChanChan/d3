const margin = {
    top: 10,
    right: 10,
    bottom: 100,
    left: 100,
};

const width = 800 - margin.right - margin.left;
const height = 500 - margin.top - margin.bottom;

//Time index
let timeIndex = 0;

const svg = d3
    .select("#chart-area")
    .append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom);

const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

//Scales
const xScale = d3.scaleLog().base(10).domain([142, 150000]).range([0, width]);
const yScale = d3.scaleLinear().domain([0, 90]).range([height, 0]);
const radius = d3.scaleSqrt().domain([0, 1400000000]).range([0, 30]);
const contientColor = d3.scaleOrdinal(d3.schemePastel1);

//Axes
const xAxisCall = d3
    .axisBottom(xScale)
    .tickValues([400, 4000, 40000])
    .tickFormat(d3.format("$"));
const yAxisCall = d3.axisLeft(yScale);

g.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${height})`)
    .call(xAxisCall);
g.append("g").attr("class", "y-axis").call(yAxisCall);

//Labels
g.append("text")
    .attr("class", "x-label")
    .attr("font-size", "20px")
    .text("GDP Per Capita($)")
    .attr("x", width / 2)
    .attr("y", height + 50)
    .attr("text-anchor", "middle");

g.append("text")
    .attr("class", "y-label")
    .attr("font-size", "20px")
    .text("Life Expectancy(Years)")
    .attr("x", -height / 2)
    .attr("y", -60)
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)");

const timeLabel = g
    .append("text")
    .attr("class", "year")
    .attr("font-size", "30px")
    .attr("fill", "grey")
    .attr("x", width)
    .attr("y", height - 10)
    .attr("text-anchor", "end");

const update = (dataset) => {
    const { countries, year } = dataset;
    //Standard transition time
    const t = d3.transition().duration(100);
    //Join new data with old elements.
    const circles = g.selectAll("circle").data(countries, (d) => d.country);

    //Remove old elements not present in the new data
    circles.exit().remove();

    circles
        .enter()
        .append("circle")
        .attr("fill", (d) => contientColor(d.continent))
        .merge(circles)
        .transition(t)
        .attr("cx", (d) => xScale(d.income))
        .attr("cy", (d) => yScale(d.life_exp))
        .attr("r", (d) => radius(d.population));

    //update the time label
    timeLabel.text(year);
};

d3.json("./data/data.json")
    .then((data) => {
        //Filter data
        data.forEach((item) => {
            item.countries = item.countries.filter((country) => {
                if (country.income && country.life_exp) {
                    country.income = +country.income;
                    country.life_exp = +country.life_exp;
                    country.population = +country.population;
                    return country;
                }
            });
        });
        d3.interval(() => {
            timeIndex = timeIndex >= data.length - 1 ? 0 : timeIndex + 1;
            update(data[timeIndex]);
        }, 100);

        update(data[0]);
    })
    .catch((e) => {
        console.error(e.message);
    });
