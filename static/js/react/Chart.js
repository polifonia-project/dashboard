const ChartViz = ({ unique_key, index ,
                removeComponent , componentList, setComponent,
                sortComponentUp , sortComponentDown}) => {


  let chart_type = '', chart_query = '', chart_series_1 = '',
      chart_series_1_x = '', chart_series_1_y = '', chart_title = '' ,
      chart_count = ''

  // TODO WYSIWYG: get content if any
  if (datastory_data.dynamic_elements && datastory_data.dynamic_elements.length) {
    datastory_data.dynamic_elements.forEach(element => {
      if (element.type == 'chart' && element.position == index) {
        chart_type = element.chart_type ;
        chart_query = element.chart_query ;
        chart_series_1 = element.chart_series ;
        chart_series_1_x = element.chart_legend.x ;
        chart_series_1_y = element.chart_legend.y ;
        chart_title = element.chart_title ;
        if (element.operations.length) {chart_count = element.operations[0]}
        // count_query = element.count_query ;
        // count_label = element.count_label;
      }
    })
  }

  const [chart, setChart] = React.useState(chart_type);
  const chartChange = event => {
    setChart(event.target.value);

    var queryButton = document.getElementById(index+'__query-btn');
    var countCheckbox = document.getElementById(index+'action1');
    if (event.target.value == 'scatterplot') {
      queryButton.style.display = "block";
      countCheckbox.style.display = "none";
    } else {
      queryButton.style.display = "none";
      countCheckbox.style.display = "block";
    }
  };

  const [query, setQuery] = React.useState(chart_query);
  const queryChange = event => { setQuery(event.target.value); };

  const [series, setSeries] = React.useState(chart_series_1);
  const seriesChange = event => { setSeries(event.target.value); };

  // TODO more series?

  const [seriesX, setSeriesX] = React.useState(chart_series_1_x);
  const seriesXChange = event => { setSeriesX(event.target.value); };

  const [seriesY, setSeriesY] = React.useState(chart_series_1_y);
  const seriesYChange = event => { setSeriesY(event.target.value); };

  const [title, setTitle] = React.useState(chart_title);
  const titleChange = event => { setTitle(event.target.value); };

  const [count, setCount] = React.useState(chart_count);
  const countChange = event => { setCount(event.target.value); };

  function alertError(data,count) {
    if (data.head.vars.length === 1 && count != 'count') {
      alert("The query must return two variables, or you should tick the box 'count'")
    }

    if (data.head.vars.length > 2) {
      alert("The query must return two variables")
    }

    if (!data.head.vars.includes('label') || !data.head.vars.includes('count')) {
      alert("The query must return two variables, called ?label and ?count")
    }
  }

  function count_grouping(arr) {
      let elCount = {};
      for (const item of arr) {
        if (elCount[item]) { elCount[item] += 1;}
        else { elCount[item] = 1; }
      } return elCount;
  }

  function basic_chart(el_id, ch_type, series, color, chartData, chartLabels, x, y) {
    let chartId = document.getElementById(el_id).getContext('2d');
    var basicChart;
    var datasets = [];
    var options = {};
    if (ch_type == 'barchart') {
      ch_type = 'bar';
      datasets = [{
          label: series,
          backgroundColor: color,
          borderColor: color,
          data: chartData,
      }];
      options = {
          responsive: true,
          maintainAspectRatio: true,
          scaleShowValues: true,
          scales: {
              yAxes: [{
                  scaleLabel: {
                      display: true,
                      labelString: y
                  },
                  beginAtZero: true
              }],
              xAxes: [{
                  scaleLabel: {
                      display: true,
                      labelString: x
                  },
                  ticks: {
                      autoSkip: false
                  }
              }]
          },
          legend: {
              labels: {
                  boxWidth: 20,
                  padding: 10,
              }
          }
      };
    }
    else if (ch_type == 'linechart') {
      ch_type = 'line';
      datasets =  [{
          label: series,
          borderColor: color,
          pointBorderColor: "#FFF",
          pointBackgroundColor: color,
          pointBorderWidth: 2,
          pointHoverRadius: 4,
          pointHoverBorderWidth: 1,
          pointRadius: 4,
          backgroundColor: 'transparent',
          fill: true,
          borderWidth: 2,
          data: chartData
      }];
      options = {
          responsive: true,
          maintainAspectRatio: true,
          spanGaps: true,
          legend: {
              labels: {
                  boxWidth: 20,
                  padding: 10,
              }
          },
          scaleShowValues: true,
          scales: {
              yAxes: [{
                  scaleLabel: {
                      display: true,
                      labelString: y
                  },
                  beginAtZero: true
              }],
              xAxes: [{
                  scaleLabel: {
                      display: true,
                      labelString: x
                  },
                  ticks: {
                      autoSkip: false
                  }
              }]
          },
          tooltips: {
              bodySpacing: 4,
              mode: "nearest",
              intersect: 0,
              position: "nearest",
              xPadding: 10,
              yPadding: 10,
              caretPadding: 10
          },
          layout: {
              padding: { left: 15, right: 15, top: 15, bottom: 15 }
          }
      }
    }
    else if (ch_type == 'doughnutchart') {
      var colors = d3.quantize(d3.interpolateHcl(datastory_data.color_code[0], datastory_data.color_code[1]), chartLabels.length )
      ch_type = 'doughnut';
      datasets = [{
          data: chartData,
          backgroundColor: colors
      }];
      options = {
          responsive: true,
          maintainAspectRatio: true,
          legend: {
              position: 'right'
          },
          layout: {
              padding: {
                  left: 20,
                  right: 20,
                  top: 20,
                  bottom: 20
              }
          }
      };
    }


    basicChart = new Chart(chartId, {
        type: ch_type,
        data: {
            labels: chartLabels,
            datasets: datasets,
        },
        options: options
    });
  }

  const fetchQuery = event => {
    if (query.length > 1) {
      // FETCH DATA
      fetch(datastory_data.sparql_endpoint+'?query='+encodeURIComponent(query),
        {
        method: 'GET',
        headers: { 'Accept': 'application/sparql-results+json' }
        }
      ).then((res) => res.json())
       .then((data) => {
         alertError(data,count);
         // empty the chart container
         document.getElementById(index+"__chartcontainer").innerHTML = '&nbsp;';
         document.getElementById(index+"__chartcontainer").innerHTML = '<canvas id="'+index+'__chartid"></canvas>';
         if (chart == 'barchart' || chart == 'linechart' || chart == 'doughnutchart') {
           let chartData = [], chartLabels = [];
           if (count == 'count') {
             if (data.head.vars.length === 1 && data.head.vars.includes('label')){
               let labels = [];
               data.results.bindings.forEach(element => {
                 let lab = (element.label.value === '') ? 'Unknown': element.label.value;
                 labels.push(lab)
               });
               var elCount = count_grouping(labels);
               chartData = Object.values(elCount);
               chartLabels = Object.keys(elCount);
             }
           } else {
             if (data.head.vars.includes('count') && data.head.vars.includes('label')) {
               data.results.bindings.forEach(element => {
                 chartData.push(element.count.value)
                 chartLabels.push(element.label.value)
               });
             }
           }
           if (chartData.length && chartLabels.length) {
             let el_id  = index+'__chartid' ,
                ch_type = chart ,
                ch_series = series,
                color   = datastory_data.color_code[0],
                x       = seriesX ,
                y       = seriesY
             basic_chart(el_id, ch_type, series, color, chartData, chartLabels, x, y)
           }
         }
         else if (chart == 'scatterplot') {

         }
        })
       .catch((error) => {
          console.error('Error:', error);
       });


    }
  }
  // preview
  React.useEffect(() => {

     fetchQuery();
     // colorSwitch
  }, []);

  // modal examples

  // WYSIWYG: render component and preview
  // TODO if scatterlpot -> add queries
  // if doughnut -> change inputs?
  if (window.location.href.indexOf("/modify/") > -1) {
    return (
    <div id={index+"__block_field"} className="block_field">
      <h4 className="block_title">{index}. Add a chart</h4>
      <SortComponent
        index={index}
        sortComponentUp={sortComponentUp}
        sortComponentDown={sortComponentDown}
        key={unique_key} />
      <RemoveComponent
        index={index}
        removeComponent={removeComponent}
        key={unique_key} />
        <h3>{title}</h3>
        <div id={index+"__chartcontainer"} className='chart-container'>
          <canvas id={index+"__chartid"}></canvas>
        </div>

        <div className='form-group' id={index+"__form_group"}>
        	<label htmlFor='exampleFormControlSelect2'>Chart Type</label>
  				<select defaultValue={chart} name={index+"__chart_type"}
            className='form-control'
            id={index+"__chart_type"}
            onChange={chartChange}>
  					<option defaultValue="linechart" name={index+"__linechart"} id={index+"__linechart"}>linechart</option>
  					<option defaultValue="barchart" name={index+"__barchart"} id={index+"__barchart"}>barchart</option>
  					<option defaultValue="doughnutchart" name={index+"__doughnutchart"} id={index+"__doughnutchart"}>doughnutchart</option>
  					<option defaultValue="scatterplot" name={index+"__scatterplot"} id={index+"__scatterplot"}>scatterplot</option>
  				</select>

          <a href='#' className='form-text'
                role='button'
                data-toggle='modal'
                data-target='#chartsModalLong'>Learn more about queries and charts</a><br/>

          <label htmlFor='largeInput'>Chart Title</label>
    			<input name={index+"__chart_title"}
                type='text' className='form-control'
                id={index+"__chart_title"}
                onChange={titleChange}
                defaultValue={title}
                placeholder='The title of the cart' required>
          </input>

          <label htmlFor='largeInput'>SPARQL query</label>
        	<textarea name={index+"__chart_query"}
                    onChange={queryChange}
                    defaultValue={query}
                    type='text' rows='3'
                    id={index+"__chart_query"}
                    onMouseLeave={fetchQuery}
                    placeholder='A SPARQL query that returns two variables' required>
          </textarea>

          <div className='form-group row'
              style={{display: 'flex'}}>
            <label>Series label</label>
    				<input style={{display: 'block'}}
              className='form-control'
              onChange={seriesChange}
              defaultValue={series}
              type='text'
              name={index+"__chart_series"}
              id={index+"__chart_series"}
              placeholder='The label of the data series'>
              </input>
          </div>


          <div className='form-group row'
              id={index+"__axes_label"}
              style={{display: 'flex'}}>
            <div className='col-6'>
              <label>x label</label>
              <input name={index+"__chart_label_x"}
                    type='text' id={index+"__chart_label_x"}
                    onChange={seriesXChange}
                    defaultValue={seriesX}
                    placeholder='The label of the x axis'>
              </input>
            </div>
            <div className='col-6'>
              <label>y label</label>
              <input name={index+"__chart_label_y"}
                    type='text' id={index+"__chart_label_y"}
                    onChange={seriesYChange}
                    defaultValue={seriesY}
                    placeholder='The label of the y axis'>
              </input>
            </div>
          </div>

          <div id={index+"action1"}>
            <label>Operations</label><br/>
    				<input type='checkbox'
                  id='count'
                  name={index+"action1"}
                  onChange={countChange}
                  defaultValue={count}>
            </input>
            <label htmlFor='count'>Count</label>
          </div>

  				{/*<input type='checkbox'
                id='sort'
                name={index+"action2"}
                value='sort'>
  				<label htmlFor='count'>Sort</label>*/}

          {/* TODO onClick add another box */}
          <a id={index+"__query-btn"}
            style={{display: 'none'}}
            className='btn btn-primary btn-border'
            extra='True'
            name={index+"__query-btn"}>Add another series</a>
  			</div>
    </div>
    );
  } else {
    // Final story: render preview
    return (
      <>
        <h3>{title}</h3>
        <div id={index+"__chartcontainer"} className='chart-container'>
          <canvas id={index+"__chartid"}></canvas>
        </div>
      </>

    );
  }
}
