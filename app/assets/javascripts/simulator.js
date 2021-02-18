//= require d3

function draw_color_map() {
  const colorScale = d3.scale.linear().domain([0.0,1.0])
    .range(["#dddddd", "#0041ff"]);
  const cmap = d3.select('svg#colormap-svg')
    .attr("width", 180)
    .attr("height", 30);
  cmap.selectAll("rect")
    .data([0.0, 0.2, 0.4, 0.6, 0.8, 1.0])
    .enter().append("rect")
    .attr({
      x: function(d, i) { return i * 30.0;},
      y: 0.0,
      width: 29,
      height: 29,
      fill: function(d) { return colorScale(d); }
    });
};

function show_loading_spin_arc(svg, width, height) {
  const radius = Math.min(width, height) / 2;
  const loading_spin = svg.append("g")
    .attr("transform", "translate(" + radius + "," + radius + ")")
    .attr("id", "loading-spin");
  const arc = d3.svg.arc()
    .innerRadius(radius*0.5)
    .outerRadius(radius*0.9)
    .startAngle(0);
  loading_spin.append("path")
    .datum({endAngle: 0.66*Math.PI})
    .style("fill", "#4D4D4D")
    .attr("d", arc)
    .call(spin, 1500);
  const message = radius > 100 ? "LOADING: click here to cancel" : "LOADING";
  loading_spin.append("g")
    .attr("transform", "translate(" + radius + ",0)")
    .append("text")
    .style({
      "text-anchor": "left",
      "font-size": radius*0.3
    })
    .text(message);

  function spin(selection, duration) {
    selection.transition()
      .ease("linear")
      .duration(duration)
      .attrTween("transform", function() {
        return d3.interpolateString("rotate(0)", "rotate(360)");
      });
    setTimeout( function() { spin(selection, duration); }, duration);
  };
  return loading_spin;
}

function draw_progress_overview(url) {
  const colorScale = d3.scale.linear().domain([0.0,1.0])
    .range(["#dddddd", "#0041ff"]);

  const margin = {top: 10, right: 0, bottom: 10, left: 0},
        width = 720,
        height = 720;
  const rowLabelMargin = 100;
  const columnLabelMargin = 100;
  const tickTextOffset = [10, 5];
  const labelTextOffset = {column: -7, row: 2};
  const fontsize = 12;

  const toolTip = d3.select("#progress-tooltip");

  const progress_overview = d3.select("#progress-overview");
  const svg = progress_overview.append("svg")
    .attr("id", "canvas")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);
  const arc_svg = d3.select('#spin_arc');
  const loading = show_loading_spin_arc(arc_svg, arc_svg.attr("width"), arc_svg.attr("height"));

  const xhr = d3.json(url)
    .on("load", function(dat) {
    progress_overview.select("svg").remove();
    loading.remove();

    const rectSizeX = (width - rowLabelMargin) / dat.parameter_values[0].length;
    const rectSizeY = (height - columnLabelMargin) / dat.parameter_values[1].length;

    let drag_flag = 0;
    let mousedownX = 0;
    let mousedownY = 0;
    let mousedragX = 0;
    let mousedragY = 0;
    let vbox_x = 0;
    let vbox_y = 0;
    const vbox_default_width = vbox_width = width - columnLabelMargin;
    const vbox_default_height = vbox_height = height - rowLabelMargin;
    let zoom_scale = 1.0;

    function adjust_boundary_conditions(x, y) {
      if (x < 0) {
        x=0;
      }
      if (y < 0) {
        y=0;
      }
      if (x + vbox_width > vbox_default_width) {
        x=vbox_default_width-vbox_width;
      }
      if (y + vbox_height > vbox_default_height) {
        y=vbox_default_height-vbox_height;
      }
      return [x,y];
    };

    function set_view_box(x, y) {
      d3.select('svg#inner_canvas')
        .attr("viewBox", "" + x + " " + y + " " + vbox_width + " " + vbox_height);
      d3.select('svg#rowLabel_canvas')
        .attr("viewBox", "" + 0 + " " + y + " " + (rowLabelMargin-tickTextOffset[0]) + " " + vbox_height);
      d3.select('svg#columnLabel_canvas')
        .attr("viewBox", "" + x + " " + 0 + " " + vbox_width + " " + (columnLabelMargin-tickTextOffset[1]));
    };

    function mouse_zoom(eventObject) {
      const center = d3.mouse(eventObject);
      vbox_width = vbox_default_width * zoom_scale;
      vbox_height = vbox_default_height * zoom_scale;
      vbox_x = center[0] - vbox_width/2;
      vbox_y = center[1] - vbox_height/2;
      const vboxes = adjust_boundary_conditions(vbox_x, vbox_y);
      vbox_x = vboxes[0];
      vbox_y = vboxes[1];
      set_view_box(vbox_x,vbox_y);
      d3.select('g#rowLabelRegion')
        .attr("font-size",fontsize*Math.sqrt(zoom_scale));
      d3.select('g#columnLabelRegion')
        .attr("font-size",fontsize*Math.sqrt(zoom_scale));
    };



    const inner_svg = svg.append("svg")
      .attr("id", "inner_canvas")
      .attr("x", margin.left + rowLabelMargin)
      .attr("y", margin.top + columnLabelMargin)
      .attr("width", width - rowLabelMargin)
      .attr("height", height - columnLabelMargin)
      .attr("viewBox", "" + vbox_x + " " + vbox_y + " " + vbox_width + " " + vbox_height)
      .append("g")
      .on("mouseup", function() {
        if (drag_flag==1) {
          mousedragX = d3.event.pageX - mousedownX;
          mousedragY = d3.event.pageY - mousedownY;
          vbox_x -= mousedragX * zoom_scale;
          vbox_y -= mousedragY * zoom_scale;
          const vboxes = adjust_boundary_conditions(vbox_x, vbox_y);
          vbox_x = vboxes[0];
          vbox_y = vboxes[1];
          set_view_box(vbox_x,vbox_y);
        }
      })
      .on("mousemove", function() {
          drag_flag = 1;
      })
      .on("mousedown", function() {
          drag_flag = 0;
          mousedownX = d3.event.clientX;
          mousedownY = d3.event.clientY;
      })
      .on("mousewheel", function() {
        if (d3.event.wheelDelta==120) {
          zoom_scale *= 0.75;
        } else if (d3.event.wheelDelta==-120) {
          zoom_scale /= 0.75;
          if (zoom_scale>=1) {
            zoom_scale=1;
          }
        }
        mouse_zoom(this);
      })
      .on("DOMMouseScroll", function() {
        if (d3.event.detail==-3) {
          zoom_scale *= 0.75;
        } else if (d3.event.detail==3) {
          zoom_scale /= 0.75;
          if (zoom_scale>=1) {
            zoom_scale=1;
          }
        }
        mouse_zoom(this);
      });

    svg.append("line")
      .attr({
        x1: 0, y1: margin.top+columnLabelMargin-2,
        x2: width, y2: margin.top+columnLabelMargin-2,
        stroke: "black",
        "stroke-width": 1
      });
    svg.append("line")
      .attr({
        x1: margin.left+rowLabelMargin-2, y1: 0,
        x2: margin.left+rowLabelMargin-2, y2: height,
        stroke: "black",
        "stroke-width": 1
      });

    const rectRegion = inner_svg.append("g");

    const row = rectRegion.selectAll("g")
      .data(dat.num_runs)
      .enter().append("g")
        .attr("transform", function(d, i) {
          return "translate(" + 0 + "," + i*rectSizeY + ")"
        });

    row.selectAll("rect")
      .data( function(d) { return d;})
      .enter().append("rect")
        .attr({
          x: function(d,i) {
            return i*rectSizeX;
          },
          y: 0,
          width: rectSizeX,
          height: rectSizeY,
          rx: 5,
          ry: 5,
          fill: function(d) {
            if( d[1] > 0.0 ) { return colorScale(d[0]/d[1]); }
            else { return "white"; }
          },
          stroke: "white",
          "stroke-width": 2
        })
        .on("mouseover", function(d) {
          if( d[1] > 0.0 ) {
            toolTip.transition()
              .duration(200)
              .style("opacity", .8);
            toolTip.html( "Finished/Total: " + d[0] + " / " + d[1] + "<br />Total: " + 100.0*d[0]/d[1] + " %")
              .style("left", (d3.event.pageX+10) + "px")
              .style("top", (d3.event.pageY-28) + "px");
          }
        })
        .on("mousemove", function(d) {
          toolTip.style("left", (d3.event.pageX+10) +  "px")
            .style("top", (d3.event.pageY-28) + "px");
        })
        .on("mouseout", function(d) {
          toolTip.transition()
            .duration(500)
            .style("opacity", 0);
        });

    const rowLabelKeyRegion = svg.append("g")
      .attr("transform", "translate(" + 0 + "," + columnLabelMargin + ")");

    rowLabelKeyRegion.append("text")
      .attr({
        x: rowLabelMargin / 2,
        y: labelTextOffset.row,
        "text-anchor": "middle"
      })
      .text(dat.parameters[1]);

    const rowLabelsvg = svg.append("svg")
      .attr("id", "rowLabel_canvas")
      .attr("x", margin.left)
      .attr("y", margin.top + columnLabelMargin)
      .attr("width", rowLabelMargin-tickTextOffset[0])
      .attr("height", height - columnLabelMargin)
      .attr("preserveAspectRatio", "none")
      .attr("viewBox", "" + 0 + " " + vbox_y + " " + (rowLabelMargin-tickTextOffset[0]) + " " + vbox_height);

    const rowLabelRegion = rowLabelsvg.append("g")
      .attr("id","rowLabelRegion")
      .attr("font-size",fontsize);

    rowLabelRegion.selectAll("text")
      .data(dat.parameter_values[1])
      .enter().append("text")
      .attr({
        "x": rowLabelMargin-tickTextOffset[0],
        "y": function(d,i) { return (i + 0.5) * rectSizeY; },
        "dx": -tickTextOffset[0],
        "dy": tickTextOffset[1],
        "text-anchor": "end"
      })
      .text(function(d) { return d;});

    const columnLabelKeyRegion = svg.append("g")
      .attr("transform", "translate(" + rowLabelMargin + "," + columnLabelMargin + ") rotate(-90)");

    columnLabelKeyRegion.append("text")
      .attr({
        x: columnLabelMargin / 2,
        y: labelTextOffset.column,
        "text-anchor": "middle"
      })
      .text(dat.parameters[0]);

    const columnLabelsvg = svg.append("svg")
      .attr("id", "columnLabel_canvas")
      .attr("x", margin.left + rowLabelMargin)
      .attr("y", margin.top)
      .attr("width", width - rowLabelMargin)
      .attr("height", columnLabelMargin-tickTextOffset[1])
      .attr("preserveAspectRatio", "none")
      .attr("viewBox", "" + vbox_x + " " + 0 + " " + vbox_width + " " + (columnLabelMargin-tickTextOffset[1]));

    const columnLabelRegion = columnLabelsvg.append("g")
      .attr("id","columnLabelRegion")
      .attr("font-size",fontsize)
      .attr("transform", "translate(" + 0 + "," + columnLabelMargin + ") rotate(-90)");

    columnLabelRegion.selectAll("text")
      .data(dat.parameter_values[0])
      .enter().append("text")
      .attr({
        "x": 0,
        "y": function(d,i) { return (i+0.5) * rectSizeX;},
        "dx": tickTextOffset[0],
        "dy": tickTextOffset[1],
        "text-anchor": "start"
      })
      .text(function(d) { return d; });
  })
  .on("error", function(error) {
    console.warn(error);
    loading.remove();
  })
  .get();

  loading.on("mousedown", function() {
    xhr.abort();
    loading.remove();
  })
};

function validate_filter_value(type, val) {
  if (!val) { return "must not be empty"; }
  else if (type=="Integer") {
    if (val.search(/^[-]?[0-9]+$/) != 0) { return "must be an Integer"; }
  }
  else if (type=="Float") {
    if (val.search(/^[+-]?\d+(\.\d+)?$/) != 0) { return "must be a Float"; }
  }

  return false;
};

function validate_filter_name(name) {
  if (name == null || (name != null && name.length < 1)) {
    alert("Name cannot be blank.");
    return false;
  }

  return true;
};
