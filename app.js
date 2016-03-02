var data = [];
var max = 0;
var n = 10; // how many data points on the x axis of the chart
var r = 80; // how many data points on the y axis of the chart
var step = 0;

var reset = document.getElementById("reset");

var tweets = document.getElementById("tweets");
tweets.innerHTML = "00";

var margin = {top: 20, right: 20, bottom: 80, left: 80},
    width = 500 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var x = d3.scale.linear()
    .domain([0, n])
    .range([0, width]);

var y = d3.scale.linear()
    .domain([0, r])
    .range([height, 0]);

var line = d3.svg.line()
    .x(function(d, i) { return x(i); })
    .y(function(d) { return y(d); })
    .interpolate("monotone"); // though 'linear' gives more accurate data values…

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var maxLine = svg.append("rect")
    .attr("class", "max")
    .attr("x", 0)
    .attr("y", y(0))
    .attr("width", width)
    .attr("height", 1)
    .attr("opacity", 0);

var maxLabel = svg.append("text")
    .attr("x", (width-margin.left)/2)
    .attr("y",  y(max) - 18 )
    .style("text-anchor", "start")
    .attr("class", "maxLabel")
    .attr("opacity", 0);

// this clipPath makes a mask the size of the graphic
svg.append("defs").append("clipPath")
    .attr("id", "clip")
  .append("rect")
    .attr("width", width)
    .attr("height", height);

var path = svg.append("g")
    .attr("clip-path", "url(#clip)")
  .append("path");

// Define the axes
var xAxis = d3.svg.axis().scale(x)
    .orient("bottom").ticks(n);

var yAxis = d3.svg.axis().scale(y)
    .orient("left").ticks(n);

svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + y(0) + ")")
    .call(xAxis);

svg.append("g")
    .attr("class", "y axis")
    .call(yAxis);

// text label for the x axis
svg.append("text")
    .attr("x", width/2 )
    .attr("y",  y(0) + margin.bottom/2 )
    .style("text-anchor", "middle")
    .text("seconds")
    .attr("class", "label");

// text label for the y axis
svg.append("text")
    .attr("x", x(0) - height/2 )
    .attr("y",  0 - margin.left/1.5)
    .attr("transform", "rotate(-90)")
    .style("text-anchor", "middle")
    .text("tweets per second")
    .attr("class", "label");

nio.source.socketio(
 "http://brand.nioinstances.com",
 ["count_by_network"],
 120 // optional - will immediately stream cached data within the last 120 seconds
)
.pipe(nio.filter(function(chunk) {
   return chunk.type === "twitter";
}))
.pipe(nio.pass(function(chunk){
  tweets.innerHTML = parseInt(chunk.count_per_sec, 10);
  if (chunk.count_per_sec > max) {
    max = chunk.count_per_sec;
  }

  data.push(chunk.count_per_sec);

  path.datum(data)
    .attr("class", "line")
    .attr("d", line);

  maxLine.transition()
    .attr("opacity", function(){
      if (step < n) {
        step += 1;
      }
      return step/(n*1.5);
    })
    .attr("y", y(max) - 2);

  maxLabel.transition()
    .attr("opacity", function(){
      if (step < n) {
        step += 1;
      }
      return step/(n*1.5);
    })
    .attr("y", y(max) - 18 )
    .text("max: " + parseInt(max, 10));

  path.append("title") // animation is too fast for this to work well
    .text(function(d) {
      d = parseInt(d, 10);
      return d;
    });

  if (data.length > n + 1) {

    reset.addEventListener("click", function(e) {
      max = d3.max(data);
    });

    path
    .attr("d", line) // redraw path immediately prior to the transition
    .attr("transform", null)
    .transition()
      .duration(860)
      .ease("linear")
      .attr("transform", "translate(" + x(-1) + ",0)"); // then apply translate

    x.domain([1, n + 1]); // expand domain before transition
    svg.selectAll(".x.axis")
    .call(xAxis) // redraw axis immediately prior to the transition
    .transition()
      .duration(860)
      .ease("linear")
      .call(xAxis);

    data.shift();
    x.domain([0, n]);
    svg.selectAll(".x.axis")
      .call(xAxis);
  }

  console.log(data);
  console.log(max);
}))
