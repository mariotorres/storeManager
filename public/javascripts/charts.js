/**
 * Created by mtorres on 18/11/16.
 */

lineChart();
barChart();
pieChart();

function lineChart() {

    var svg = d3.select("#linechart"),
        margin = {top: 20, right: 20, bottom: 30, left: 50},
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom,
        g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var parseTime = d3.timeParse("%d-%b-%y");

    var x = d3.scaleTime()
        .rangeRound([0, width]);

    var y = d3.scaleLinear()
        .rangeRound([height, 0]);

    var line = d3.line()
        .x(function (d) {
            return x(d.date);
        })
        .y(function (d) {
            return y(d.close);
        });

    d3.tsv("data.tsv", function (d) {
        d.date = parseTime(d.date);
        d.close = +d.close;
        return d;
    }, function (error, data) {
        if (error) throw error;

        x.domain(d3.extent(data, function (d) {
            return d.date;
        }));
        y.domain(d3.extent(data, function (d) {
            return d.close;
        }));

        g.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

        g.append("g")
            .attr("class", "axis axis--y")
            .call(d3.axisLeft(y))
            .append("text")
            .attr("fill", "#000")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", "0.71em")
            .style("text-anchor", "end")
            .text("Price ($)");

        g.append("path")
            .datum(data)
            .attr("class", "line")
            .attr("d", line);
    });

}

function pieChart() {
    var canvas = document.querySelector("#piechart"),
        context = canvas.getContext("2d");

    var width = canvas.width,
        height = canvas.height,
        radius = Math.min(width, height) / 2;

    var colors = ["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"];

    var arc = d3.arc()
        .outerRadius(radius - 10)
        .innerRadius(0)
        .context(context);

    var labelArc = d3.arc()
        .outerRadius(radius - 40)
        .innerRadius(radius - 40)
        .context(context);

    var pie = d3.pie()
        .sort(null)
        .value(function(d) { return d.population; });

    context.translate(width / 2, height / 2);

    d3.csv("data_piechart.csv", function(d) {
        d.population = +d.population;
        return d;
    }, function(error, data) {
        if (error) throw error;

        var arcs = pie(data);

        arcs.forEach(function(d, i) {
            context.beginPath();
            arc(d);
            context.fillStyle = colors[i];
            context.fill();
        });

        context.beginPath();
        arcs.forEach(arc);
        context.strokeStyle = "#fff";
        context.stroke();

        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = "#000";
        arcs.forEach(function(d) {
            var c = labelArc.centroid(d);
            context.fillText(d.data.age, c[0], c[1]);
        });
    });
}

function barChart() {

    var svg = d3.select("#barchart"),
        margin = {top: 20, right: 20, bottom: 30, left: 40},
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom;

    var x = d3.scaleBand().rangeRound([0, width]).padding(0.1),
        y = d3.scaleLinear().rangeRound([height, 0]);

    var g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.tsv("data_barchart.tsv", function(d) {
        d.frequency = +d.frequency;
        return d;
    }, function(error, data) {
        if (error) throw error;

        x.domain(data.map(function(d) { return d.letter; }));
        y.domain([0, d3.max(data, function(d) { return d.frequency; })]);

        g.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

        g.append("g")
            .attr("class", "axis axis--y")
            .call(d3.axisLeft(y).ticks(10, "%"))
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", "0.71em")
            .attr("text-anchor", "end")
            .text("Frequency");

        g.selectAll(".bar")
            .data(data)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", function(d) { return x(d.letter); })
            .attr("y", function(d) { return y(d.frequency); })
            .attr("width", x.bandwidth())
            .attr("height", function(d) { return height - y(d.frequency); });
    });

}

// Refresh every 15 min
/*
setInterval(function () {
    location.reload();
}, (1000 * 60) * 15 );
*/
