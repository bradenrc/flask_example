function  BrunelVis(visId, ymax) {
  "use strict";                                                                       // strict mode
  var datasets = [],                                      // array of datasets for the original data
      pre = function(d, i) { return d },                         // default pre-process does nothing
      post = function(d, i) { return d },                       // default post-process does nothing
      transitionTime = 200,                                        // transition time for animations
      charts = [],                                                       // the charts in the system
      vis = d3.select('#' + visId).attr('class', 'brunel');                     // the SVG container

  BrunelD3.addDefinitions(vis);                                   // ensure standard symbols present

  // Define chart #1 in the visualization //////////////////////////////////////////////////////////

  charts[0] = function(parentNode, filterRows) {
    var geom = BrunelD3.geometry(parentNode || vis.node(), 0, 0, 1, 1, 0, 0, 0, 0),
      elements = [];                                              // array of elements in this chart

    // Define groups for the chart parts ///////////////////////////////////////////////////////////

    var chart =  vis.append('g').attr('class', 'chart1')
      .attr('transform','translate(' + geom.chart_left + ',' + geom.chart_top + ')');
    var overlay = chart.append('g').attr('class', 'element').attr('class', 'overlay');
    var zoom = d3.zoom().scaleExtent([1/3,3]);
    var zoomNode = overlay.append('rect').attr('class', 'overlay')
      .attr('x', geom.inner_left).attr('y', geom.inner_top)
      .attr('width', geom.inner_rawWidth).attr('height', geom.inner_rawHeight)
      .style('cursor', 'default')
      .node();
    zoomNode.__zoom = d3.zoomIdentity;
    chart.append('rect').attr('class', 'background').attr('width', geom.chart_right-geom.chart_left).attr('height', geom.chart_bottom-geom.chart_top);
    var interior = chart.append('g').attr('class', 'interior zoomNone')
      .attr('transform','translate(' + geom.inner_left + ',' + geom.inner_top + ')')
      .attr('clip-path', 'url(#clip_visualization_chart1_inner)');
    interior.append('rect').attr('class', 'inner').attr('width', geom.inner_width).attr('height', geom.inner_height);
    var gridGroup = interior.append('g').attr('class', 'grid');
    vis.append('clipPath').attr('id', 'clip_visualization_chart1_inner').append('rect')
      .attr('x', 0).attr('y', 0)
      .attr('width', geom.inner_rawWidth+1).attr('height', geom.inner_rawHeight+1);

    // Scales //////////////////////////////////////////////////////////////////////////////////////

    var scale_x = d3.scalePoint().padding(0.5)
      .domain(['const'])
      .range([0, geom.inner_radius]);
    var scale_inner = d3.scaleLinear().domain([0,1])
      .range([-0.5, 0.5]);
    var scale_y = d3.scaleLinear().domain([0, ymax])
      .range([0, Math.PI*2]);
    var base_scales = [scale_x, scale_y];                           // untransformed original scales
    zoom.on('zoom', function(t, time) {
        t = t ||BrunelD3.restrictZoom(d3.event.transform, geom, this);
        zoomNode.__zoom = t;
        interior.attr('class', 'interior ' + BrunelD3.zoomLabel(t.k));;
        build(time || -1);
    });

    // Define element #1 ///////////////////////////////////////////////////////////////////////////

    elements[0] = function() {
      var original, processed,                           // data sets passed in and then transformed
        element, data,                                 // brunel element information and brunel data
        selection, merged;                                      // d3 selection and merged selection
      var elementGroup = interior.append('g').attr('class', 'element1')
        .attr('transform','translate(' + geom.inner_width/2 + ',' + geom.inner_height/2 + ')'),
        main = elementGroup.append('g').attr('class', 'main'),
        labels = BrunelD3.undoTransform(elementGroup.append('g').attr('class', 'labels').attr('aria-hidden', 'true'), elementGroup);

      function makeData() {
        original = datasets[0];
        if (filterRows) original = original.retainRows(filterRows);
        processed = pre(original, 0)
          .addConstants("'const'")
          .stack("Amnt; 'const'; Type; false");
        processed = post(processed, 0);
        var f0 = processed.field('Amnt$lower'),
          f1 = processed.field('Amnt$upper'),
          f2 = processed.field("'const'"),
          f3 = processed.field('Amnt'),
          f4 = processed.field('Type'),
          f5 = processed.field('#row'),
          f6 = processed.field('#selection');
        var keyFunc = function(d) { return f2.value(d)+ '|' + f4.value(d) };
        data = {
          Amnt$lower:   function(d) { return f0.value(d.row) },
          Amnt$upper:   function(d) { return f1.value(d.row) },
          _const_:      function(d) { return f2.value(d.row) },
          Amnt:         function(d) { return f3.value(d.row) },
          Type:         function(d) { return f4.value(d.row) },
          $row:         function(d) { return f5.value(d.row) },
          $selection:   function(d) { return f6.value(d.row) },
          Amnt$lower_f: function(d) { return f0.valueFormatted(d.row) },
          Amnt$upper_f: function(d) { return f1.valueFormatted(d.row) },
          _const__f:    function(d) { return f2.valueFormatted(d.row) },
          Amnt_f:       function(d) { return f3.valueFormatted(d.row) },
          Type_f:       function(d) { return f4.valueFormatted(d.row) },
          $row_f:       function(d) { return f5.valueFormatted(d.row) },
          $selection_f: function(d) { return f6.valueFormatted(d.row) },
          _split:       function(d) { return f4.value(d.row) },
          _key:         keyFunc,
          _rows:        BrunelD3.makeRowsWithKeys(keyFunc, processed.rowCount())
        };
      }
      // Aesthetic Functions
      var scale_color = d3.scaleOrdinal()
        .domain(["'Camping Equipment'", "'Mountaineering Equipment'", "'Personal Accessories'"])
        .range([ '#347DAD', '#D43F58', '#F7D84A', '#31A461', '#A66A9C', '#FF954D',
          '#A7978E', '#FFCA4D', '#F99EAF', '#B1C43B', '#7E64A2', '#FFB04D', '#CA5C7C',
          '#DDBC8C', '#FFA28D', '#A5473D', '#8B6141', '#F57357', '#5C6B46']);
      var color = function(d) { return scale_color(data.Type(d)) };

      // Build element from data ///////////////////////////////////////////////////////////////////

      function build(transitionMillis) {
        element = elements[0];
        var w = 0.9 * geom.inner_width;
        var x = function(d) { return scale_x(data._const_(d))};
        var h = Math.abs( scale_y(scale_y.domain()[0] + 1.0) - scale_y.range()[0] );
        var y1 = function(d) { return scale_y(data.Amnt$lower(d))};
        var y2 = function(d) { return scale_y(data.Amnt$upper(d))};
        var y = function(d) { return scale_y( (data.Amnt$upper(d) + data.Amnt$lower(d) )/2)};
        // Define the path for pie wedge shapes
        var path = d3.arc().innerRadius(0).outerRadius(geom.inner_radius)
          .startAngle(y1).endAngle(y2);
        var labeling  = [{
          index: 0, method: 'wedge', location: ['center', 'center'], inside: false, align: 'middle', pad: 3, dy: 0.3,
          fit: false, granularity: 1,
          path: path,
          content: function(d) {
            return d.row == null ? null : data.Type_f(d)
          }
        }];

        // Define selection entry operations
        function initialState(selection) {
          selection
            .attr('class', 'element bar filled')
            .style('pointer-events', 'none')
        }

        // Define selection update operations on merged data
        function updateState(selection) {
          selection
            .attr('d', path)
            .filter(BrunelD3.hasData)                     // following only performed for data items
            .style('fill', color);
        }

        // Define labeling for the selection
        function label(selection, transitionMillis) {
          BrunelD3.label(selection, labels, transitionMillis, geom, labeling);
        }
        // Create selections, set the initial state and transition updates
        selection = main.selectAll('.element').data(data._rows, function(d) { return d.key });
        var added = selection.enter().append('path');
        merged = selection.merge(added);
        initialState(added);
        selection.filter(BrunelD3.hasData)
          .classed('selected', BrunelD3.isSelected(data))
          .filter(BrunelD3.isSelected(data)).raise();
        updateState(BrunelD3.transition(merged, transitionMillis));
        label(merged, transitionMillis);

        BrunelD3.transition(selection.exit(), transitionMillis/3)
          .style('opacity', 0.5).each( function() {
            this.remove(); BrunelD3.removeLabels(this);
        });
      }

      return {
        data:           function() { return processed },
        original:       function() { return original },
        internal:       function() { return data },
        selection:      function() { return merged },
        makeData:       makeData,
        build:          build,
        chart:          function() { return charts[0] },
        group:          function() { return elementGroup },
        fields: {
          x:            ["'const'"],
          y:            ['Amnt'],
          key:          ["'const'", 'Type'],
          color:        ['Type']
        }
      };
    }();

    function build(time, noData) {
      var first = elements[0].data() == null;
      if (first) time = 0;                                           // no transition for first call
      if ((first || time > -1) && !noData) {
        elements[0].makeData();
      }
      elements[0].build(time);
    }

    // Expose the following components of the chart
    return {
      elements : elements,
      interior : interior,
      scales: {x:scale_x, y:scale_y},
      zoom: function(params, time) {
          if (params) zoom.on('zoom').call(zoomNode, params, time);
          return d3.zoomTransform(zoomNode);
      },
      build : build
    };
    }();

  function setData(rowData, i) { datasets[i||0] = BrunelD3.makeData(rowData) }
  function updateAll(time) { charts.forEach(function(x) {x.build(time || 0)}) }
  function buildAll() {
    for (var i=0;i<arguments.length;i++) setData(arguments[i], i);
    updateAll(transitionTime);
  }

  return {
    dataPreProcess:     function(f) { if (f) pre = f; return pre },
    dataPostProcess:    function(f) { if (f) post = f; return post },
    data:               function(d,i) { if (d) setData(d,i); return datasets[i||0] },
    visId:              visId,
    build:              buildAll,
    rebuild:            updateAll,
    charts:             charts
  }
}

// Call Code to Build the system ///////////////////////////////////////////////////////////////////
var v  = new BrunelVis('visualization', tt);
v.build(table1);

