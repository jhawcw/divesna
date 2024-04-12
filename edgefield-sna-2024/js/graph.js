function showCytoscape(eles, callback, fileName)
{
    var coseBilkent = {
        name: "cose-bilkent",
        // Called on `layoutready`
        ready: function () {
        },
        // Called on `layoutstop`
        stop: function () {
            //callback(cy, fileName);
        },
        // Whether to include labels in node dimensions. Useful for avoiding label overlap
        nodeDimensionsIncludeLabels: true,
        // number of ticks per frame; higher is faster but more jerky
        refresh: 30,
        // Whether to fit the network view after when done
        fit: true,
        // Padding on fit
        padding: 10,
        // Whether to enable incremental mode
        randomize: true,
        // Node repulsion (non overlapping) multiplier
        nodeRepulsion: 1000000,
        // Ideal (intra-graph) edge length
        idealEdgeLength: 150,
        // Divisor to compute edge forces
        edgeElasticity: 0.2,
        // Nesting factor (multiplier) to compute ideal edge length for inter-graph edges
        nestingFactor: 0.1,
        // Gravity force (constant)
        gravity: 100,
        // Maximum number of iterations to perform
        numIter: 15000,
        // Whether to tile disconnected nodes
        tile: true,
        // Type of layout animation. The option set is {'during', 'end', false}
        animate: 'end',
        // Duration for animate:end
        animationDuration: 500,
        // Amount of vertical space to put between degree zero nodes during tiling (can also be a function)
        tilingPaddingVertical: 10,
        // Amount of horizontal space to put between degree zero nodes during tiling (can also be a function)
        tilingPaddingHorizontal: 10,
        // Gravity range (constant) for compounds
        gravityRangeCompound: 1.5,
        // Gravity force (constant) for compounds
        gravityCompound: 1.0,
        // Gravity range (constant)
        gravityRange: 3.8,
        // Initial cooling factor for incremental layout
        initialEnergyOnIncremental: 0.5
        // // Amount of vertical space to put between degree zero nodes during tiling (can also be a function)
        // tilingPaddingVertical: 10,
        // // Amount of horizontal space to put between degree zero nodes during tiling (can also be a function)
        // tilingPaddingHorizontal: 10,
        // // Gravity range (constant) for compounds
        // gravityRangeCompound: 0,
        // // Gravity force (constant) for compounds
        // gravityCompound: 0,
        // // Gravity range (constant)
        // gravityRange: 10,
        // // Initial cooling factor for incremental layout
        // initialEnergyOnIncremental: 10,
    };

    var cy = cytoscape({
        container: $("#graphArea"), // container to render in
        elements: eles,
        wheelSensitivity: 0.035,
        style: [ // the stylesheet for the graph
          {
            selector: 'node',
            style: {
                'background-color': '#222',
                'label': 'data(nameData)',
                "width": "data(width)",
                "height": "data(width)",
                "font-size": "22px",
                "color": "data(labelTextColour)",
                "text-wrap": "wrap",
                "text-max-width": "160px",
                "text-background-color": "#EEE",
                "text-background-opacity": "0.8",
                "text-background-shape": "roundrectangle",
                "text-background-padding": "3px",
                "text-outline-opacity": "0.8",
                "text-outline-width": "2px",
                "text-outline-color": "#FFF",
            }
          },
          {
            selector: ':parent',
            style: {
              //'background-color': 'transparent',
              "background-opacity": "0",
              "border-width": "0",
              'label': 'data(nameData)',
              "width": "data(width)",
              "height": "data(width)",
              "font-size": "30px",
              "color": "data(labelTextColour)",
              "text-wrap": "wrap",
              "text-max-width": "240px",
              "text-background-color": "#EEE",
              "text-background-opacity": "0.8",
              "text-background-shape": "roundrectangle",
              "text-background-padding": "3px",
              "text-outline-opacity": "0.8",
              "text-outline-width": "2px",
              "text-outline-color": "#FFF",
              "z-compound-depth": "top",
            }
          },
          {
            selector: 'node > $node',
            style: {
              'background-color': 'data(colourData)',
              'label': 'data(sizeData)',
              "width": "data(width)",
              "height": "data(width)",
              "border-width": "data(borderWidthData)",
              "border-color": "#F01010",
              "border-style": "dashed",
              "font-size": "data(fontSize)",
              "shape": "data(nodeShape)",
              "color": "#FFF",
              "text-wrap": "wrap",
              "text-max-width": "220px",
              "text-outline-width": "2px",
              "text-outline-color": "#222",
              "text-background-opacity": "0",
              "text-background-padding": "0",
              "text-halign": "center",
              "text-valign": "center",
              "font-weight": "bold",
              "z-index": "2",
            }
          },
          {
            selector: 'edge',
            style: {
              "width": "data(widthData)",
              "line-color": "data(colourData)",
              "curve-style": "bezier",
              "control-point-weight": "0.1",
              "target-arrow-fill": "filled",
              "target-arrow-color": "data(colourData)",
              "target-arrow-shape": "vee",
              "arrow-scale": "2.5",
              "opacity": "data(opacData)",
              "z-index": "0",
            }
          },
          {
            selector: 'edge[arrowScaleData]',
            style: {
              "width": "data(widthData)",
              "line-color": "data(colourData)",
              "curve-style": "bezier",
              "control-point-weight": "0.1",
              "opacity": "data(opacData)",
              "z-index": "0",
              "mid-target-arrow-fill": "filled",
              "mid-target-arrow-color": "data(colourData)",
              "arrow-scale": "2",
              "mid-target-arrow-shape": "diamond",
              "target-arrow-shape": "none",
            }
          },
          // Define styles for hidden data
          {
            selector: '.showConductNode',
            style: {
              "background-color": "data(conductColour)",
              "label": "data(conductLabel)",
              "font-size": "50px",
            }
          },
          {
            selector: '.showConductEdge',
            style: {
              "line-color": "#222222",
              "mid-target-arrow-color": "#222222",
              "target-arrow-color": "#222222",
            }
          },
          {
            selector: '.showGradeNode',
            style: {
              "background-color": "data(gradeColour)",
              "label": "data(gradeLabel)",
              "font-size": "50px",
            }
          },
          {
            selector: '.showGradeEdge',
            style: {
              "line-color": "#222222",
              "mid-target-arrow-color": "#222222",
              "target-arrow-color": "#222222",
            }
          },
          {
            selector: '.showPSLENode',
            style: {
              "background-color": "data(psleColour)",
              "label": "data(psleLabel)",
              "font-size": "50px",
            }
          },
          {
            selector: '.showPSLEEdge',
            style: {
              "line-color": "#222222",
              "mid-target-arrow-color": "#222222",
              "target-arrow-color": "#222222",
            }
          },
          {
            selector: '.showGenderNode',
            style: {
              "background-color": "data(genderColour)",
            }
          },
          {
            selector: '.showStreamNode',
            style: {
              "background-color": "data(streamColour)",
            }
          },
        ],
        layout: coseBilkent,
      });

      return cy;
}
