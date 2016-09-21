function label_map_with_author_dots(batch, original_radius, final_opacity, final_radius, arrows){
    var spatial_jitter = 5
    // draw circles
    svg.selectAll(".contrib")
      .data(batch).enter()
        .append("circle")
        .attr('class', 'contribs')
        .transition()
        .duration(500)
        .delay(function(d, i) {
            return i / batch.length * 1000;
        }) //                                                             light gray   blue
        .attr("fill", function(d) {return d['byline type'] == 'byline' ? "#b4b4b4" : '#00aeef'})
        .attr("r", original_radius)
        .attr("cx", function(d) {
            return projection(city_lookup[d['location']])[0] + Math.random() * spatial_jitter - (spatial_jitter /  2); })
        .attr("cy", function(d) { 
            return projection(city_lookup[d['location']])[1] + Math.random() * spatial_jitter - (spatial_jitter / 2) ;
          })
        .attr('opacity', 1)
        .transition()
        .duration(500)
        .attr("r", final_radius)
        .attr('opacity', final_opacity)

    // add tooltips 
    $('.contribs').tipsy({ 
        gravity: 'w', 
        html: true, 
        title: function() {
          var d = this.__data__;
          return d['byline type'] == 'byline' ? '<b>' + d['contributor'] + '</b>, reporter <br> ' + d['headline'] : '<b>' + d.contributor + '</b>, contributer <br> ' + 'reporting to: ' + d['bureau 1'] + (d['bureau 2'] != '' ? ' and ' + d['bureau 2'] : '') + '<br><em>' + d['headline'] + '</em>'; 
        }
      });

//////// add information-route arcs
    // filter the data to make sure we're looking at the right points
    var contrib_arc_batch = batch.filter(function(d) {
       return (d['bureau 1'] != d['location']) 
                  && (d['byline type'] == 'contributor')
                  && (d['bureau 1'] in city_lookup)
     })

    if ((contrib_arc_batch.length > 0) && arrows){ 

            var radius = 4.5
            var route_data_temp = contrib_arc_batch.map(function(d){
              var temp = [{
                            id: d['contributor'],
                            type: "LineString",
                            coordinates:
                              [city_lookup[d['location']],
                              city_lookup[d['bureau 1']],
                             ]
                }]

              if ((d['bureau 2'] == '') || (d['location'] == d['bureau 2'])) { return temp }
              else { 
                temp.push({
                      id: d['contributor'],
                      type: "LineString",
                      coordinates: 
                          [city_lookup[d['location']],
                          city_lookup[d['bureau 2']],
                          ]
                    })
                return temp
              }
          })

            var route_data = [].concat.apply([], route_data_temp)

            var arc_path = svg.selectAll('.routes')
                .data(route_data)
    
            arc_path.enter()
                .append("path")
                .attr("class", "route")
                .attr("d", path)
                .attr("stroke-width", "1")
                .attr("fill", "none")
                .attr("stroke-dasharray", function() {return this.getTotalLength() + " " + this.getTotalLength()})
                .attr("stroke-dashoffset", function() {return this.getTotalLength()})
                .transition()
                  .duration(500)
                  .ease("linear")
                  .attr("stroke-dashoffset", 0 )
                  .style('opacity', .6)

           // Returns an attrTween for translating along the specified path element.
          function translateAlong(path) {
            window.temp = path
            var l = path.getTotalLength() - radius;
              var ps = path.getPointAtLength(0);
              var pe = path.getPointAtLength(l);
              var angl = Math.atan2(pe.y - ps.y, pe.x - ps.x) * (180 / Math.PI) - 90;
              var rot_tran = "rotate(" + angl + ")";
            return function(d, i, a) {
              return function(t) {
                var p = path.getPointAtLength(t * l);
                return "translate(" + p.x + "," + p.y + ") " + rot_tran;
              };
            };
          };
          // var arrow_heads = svg.selectAll('.routes').data(route_data)
          window.arc_path =  arc_path

          for (var i =0; i < arc_path[0].length; i++){

            var arrow = svg.append("path")
              .attr('class','arrow')
              .attr("d", d3.svg.symbol().type("triangle-down").size(5))
              .attr("shape-rendering","crispEdges")
              .style('opacity',1)
            
            arrow.transition()
              .duration(500)
              .ease("linear")
              .attrTween("transform", translateAlong(arc_path[0][i]) )
          }
          }
}
 

function label_map_with_count_dots(batch){
    // draw circles
    // process data

    for (var i = 0; i < batch.length; i++) {
      d = batch[i]
      if (d['location'] in totals){
            totals[d['location']]['total']++
            totals[d['location']][d['byline type']]++ 
          }
      else {
        totals[d['location']] = {'total':1, 'contributor':0, 'byline':0, 'opinion':0}
        totals[d['location']][d['byline type']]++ 
      }
    }
    // transition circles
    for(var location in totals){
      console.log(location)
      d3.select("[id='" + location + "']")
        .transition(500)
        .style('display', 'inline')
        .attr('r', Math.log(totals[location]['total'] + 2) * 2.5)
        .attr('opactiy', .5)
    }

    // d3.selectAll('.city_dots')
    //   .transition(500)
    //   .attr('r', function(d){
    //     console.log(d)
    //     console.log(totals)
    //     return Math.log(totals[d]['total'] + 2) * 2.5 || 0
    //   });
        

    // add tooltips 
    $('.city_dots').tipsy({ 
        gravity: 'w', 
        html: true, 
        title: function() {
          var d = totals[this.id];
          return '<b><u>' + this.id + '</u><br></b><em>Bylines filed:</em> ' + d['byline'] + '<br><em>Contributor lines:</em> ' + d['contributor']; 
        }
      });

//////// add information-route arcs
    // filter the data to make sure we're looking at the right points
    var contrib_arc_batch = batch.filter(function(d) {
       return (d['bureau 1'] != d['location']) 
                  && (d['byline type'] == 'contributor')
                  && (d['bureau 1'] in city_lookup)
     })

    if (contrib_arc_batch.length > 0){ 
            var radius = 2.5
            var route_data_temp = contrib_arc_batch.map(function(d){
              var temp = [{
                            id: d['bureau 1'],
                            type: "LineString",
                            coordinates:
                              [city_lookup[d['location']],
                              city_lookup[d['bureau 1']],
                             ]
                }]

              if ((d['bureau 2'] == '') || (d['location'] == d['bureau 2'])) { return temp }
              else { 
                temp.push({
                      id: d['bureau 2'],
                      type: "LineString",
                      coordinates: 
                          [city_lookup[d['location']],
                          city_lookup[d['bureau 2']],
                          ]
                    })
                return temp
              }
          })

            var route_data = [].concat.apply([], route_data_temp)
            var arc_path = svg.selectAll('.routes')
                .data(route_data)
    
            arc_path.enter()
                .append("path")
                .attr("class", "route")
                .attr("d", path)
                .attr("stroke-width", "1")
                .attr("fill", "none")
                .attr("stroke-dasharray", function() {
                  return this.getTotalLength() + " " + this.getTotalLength()
                })
                .attr("stroke-dashoffset", function() {
                  return this.getTotalLength()
                })
                .transition()
                  .duration(500)
                  .ease("linear")
                  .attr("stroke-dashoffset", 0 )
                  .style('opacity', .6)

           // Returns an attrTween for translating along the specified path element.
          function translateAlong(path) {
            window.temp = path
            var l = path.getTotalLength() - radius;
              var ps = path.getPointAtLength(0);
              var pe = path.getPointAtLength(l);
              var angl = Math.atan2(pe.y - ps.y, pe.x - ps.x) * (180 / Math.PI) - 90;
              var rot_tran = "rotate(" + angl + ")";
            return function(d, i, a) {
              return function(t) {
                var p = path.getPointAtLength(t * l);
                return "translate(" + p.x + "," + p.y + ") " + rot_tran;
              };
            };
          };

          // function backup(path, location) {
          //   var end = path.getTotalLength();
          //   var l = Math.log(totals[location]['total'] + 1) * 2.5

          //   var ps = path.getPointAtLength(end);
          //   var pe = path.getPointAtLength(end - l);
          //   var angl = Math.atan2(pe.y - ps.y, pe.x - ps.x) * (180 / Math.PI) - 90;
          //   var rot_tran = "rotate(" + angl + ")";
          //   return function(d, i, a) {
          //     return function(t) {
          //       var p = path.getPointAtLength(end - (t * l));
          //       // var p = path.getPointAtLength(t * l);
          //       return "translate(" + p.x + "," + p.y + ") " + rot_tran;
          //     };
          //   };
          // };

          // var arrow_heads = svg.selectAll('.routes').data(route_data)
          window.arc_path = arc_path
          window.route_data = route_data

          // for (var i = 0; i < route_data.length; i++){
          //   var loc = route_data[i].id
          //   d3.selectAll("[id='arrow " + loc + "']") 
          //     .transition()
          //     .duration(500)
          //     .ease("linear")
          //     .attrTween("transform", backup(arc_path[0][i], loc) )
          //   }

          for (var i =0; i < arc_path[0].length; i++){
            var arrow = svg.append("path")
              .attr('class','arrow')
              .attr('id', 'arrow ' + route_data[i].id)
              .attr("d", d3.svg.symbol().type("triangle-down").size(5))
              .attr("shape-rendering","crispEdges")
              .style('opacity',1)
            
            arrow.transition()
              .duration(500)
              .ease("linear")
              .attrTween("transform", translateAlong(arc_path[0][i]) )
            }

          }
}