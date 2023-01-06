const ExtraSeries = ({ indexExtra, index_parent ,
                      extras, setExtras }) => {

  // get Extra queries from datastory_data
  let defaultExtraQuery = '', defaultExtraLabel = ''
  if (datastory_data.dynamic_elements && datastory_data.dynamic_elements.length) {
    datastory_data.dynamic_elements.forEach(element => {
      if (element.type == 'chart' && element.position == index_parent) {
        if (element.extra_queries.length) {
          defaultExtraQuery = element.extra_queries[indexExtra].extra_query;
          defaultExtraLabel = element.extra_queries[indexExtra].extra_series;
        }
      }
    })
  }

  const [extraQuery, setExtraQuery] = React.useState(defaultExtraQuery);
  const extraQueryChange = index => event => {
    setExtraQuery(event.target.value);
    let newArr = [...extras];
    newArr[index].extra_query = event.target.value;
    setExtras(newArr);
  };

  const [extraLabel, setExtraLabel] = React.useState(defaultExtraLabel);
  const extraLabelChange = index => event => {
    setExtraLabel(event.target.value);
    let newArr = [...extras];
    newArr[index].extra_series = event.target.value;
    setExtras(newArr);
  };

  // fetchExtraQuery
  const fetchExtraQuery = index_parent => event => {
    if (extraQuery.length > 1) {
      //$('#loader').removeClass('hidden');
      // destroy chart
      // document.getElementById(index_parent+"__chartcontainer").innerHTML = '&nbsp;';
      // document.getElementById(index_parent+"__chartcontainer").innerHTML = '<canvas id="'+index_parent+'__chartid"></canvas>';

      let labels = [] , queries = [] , title = "", x ='', y='';

      datastory_data.dynamic_elements.forEach(element => {
        if (element.type == 'chart' && element.position == index_parent) {
          queries.push(element.chart_query)
          labels.push(element.chart_series)
          title = element.chart_title;
          y = element.chart_legend.y;
          x = element.chart_legend.x;
          element.extra_queries.forEach(el => {
            queries.push(el.extra_query)
            labels.push(el.extra_series)
          })
        }
      });

      let colors = d3.quantize(d3.interpolateHcl(datastory_data.color_code[0], datastory_data.color_code[1]), queries.length);

      let ch_type = 'scatter';
      let promises = [];
      queries.forEach((q, i) => {
        promises.push(fetch(datastory_data.sparql_endpoint+'?query='+encodeURIComponent(q),
          { method: 'GET', headers: { 'Accept': 'application/sparql-results+json' }}
        ))
      })

      Promise.all(promises)
      .then(function (responses) {
      return Promise.all(responses.map(function (response) {
    		return response.json();
    	}));})
      .then(function (resultdata) {
        let datasets = [];
        resultdata.forEach((data,i) => {
          let dataset = {}, seriesData = [], seriesLabels = [];
          if (data.head.vars.includes('x')
           && data.head.vars.includes('y')) {
            data.results.bindings.forEach(element => {
              const xValue = parseInt(element.x.value);
              const yValue = parseInt(element.y.value);
              const entryObj = { x: xValue, y: yValue }
              seriesLabels.push(xValue);
              seriesData.push(entryObj);
            });
            dataset.label = labels[i];
            dataset.data = seriesData;
            dataset.backgroundColor = colors[i];
            datasets.push(dataset);
         }
       });
        return datasets
      })
      .then(function(datasets) {
        let chartId = document.getElementById(index_parent+'__chartid').getContext('2d');

        let scatterChart = new Chart(chartId, {
            type: ch_type,
            data: {datasets: datasets},
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top',},
                    title: { display: true, text: title }
                },
                scales: {
                    yAxes: [{
                        scaleLabel: { display: true, labelString: y},
                        beginAtZero: true
                    }],
                    xAxes: [{
                        scaleLabel: { display: true, labelString: x},
                        ticks: { autoSkip: false }
                    }]
                }
            }
        });

      })
      .catch(function (error) {console.log(error);})
      //.finally( () => {$('#loader').addClass('hidden')});

    }
  };

  React.useEffect(() => {
     fetchExtraQuery(index_parent);
  }, []);

  let extra_id = new Date().getTime();
  return (
    <div className="query-div">
    <hr/>
      <h4 style={{ color: 'white'}}>Add a series</h4><br/>
      {/* add remove component new*/}
      <label htmlFor='largeInput'>SPARQL query</label>
      <textarea
          onMouseLeave={fetchExtraQuery(index_parent)}
          onChange={() => extraQueryChange(indexExtra)}
          id={index_parent+"__extra_query_"+extra_id}
          name={index_parent+"__extra_query_"+extra_id}
          defaultValue={extraQuery}
          placeholder='A SPARQL query that returns two variables' required>
      </textarea>
  		<input className='form-control'
          onChange={() => extraLabelChange(indexExtra)}
          type='text'
          id={index_parent+"__extra_series_"+extra_id}
          name={index_parent+"__extra_series_"+extra_id}
          defaultValue={extraLabel}
          placeholder='The label of the data series'>
      </input>
    </div>
  )
}

const ChartViz = ({ unique_key, index ,
                removeComponent , componentList, setComponent,
                sortComponentUp , sortComponentDown }) => {

  let basicChart, chart_type = '', chart_query = '', chart_series_1 = '',
      chart_series_1_x = '', chart_series_1_y = '', chart_title = '' ,
      chart_count = '', extra_queries = [] , image;

  // WYSIWYG: get content if any
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
        if (element.extra_queries.length) {
          element.extra_queries.forEach(element => {
            extra_queries.push(element);
          }) ;
        }
      }
    })
  }

  function add_series_btn(index,ch_type) {
    var queryButton = document.getElementById(index+'__query-btn');
    var countCheckbox = document.getElementById(index+'__action1');
    if (ch_type == 'scatterplot') {
      queryButton.style.display = "block";
      countCheckbox.style.display = "none";
    } else {
      queryButton.style.display = "none";
      countCheckbox.style.display = "block";
    }
  }

  const [chart, setChart] = React.useState(chart_type);
  const chartChange = event => {
    setChart(event.target.value);
    add_series_btn(index,event.target.value);
  };

  const [query, setQuery] = React.useState(chart_query);
  const queryChange = event => { setQuery(event.target.value); };

  const [series, setSeries] = React.useState(chart_series_1);
  const seriesChange = event => { setSeries(event.target.value); };

  const [extras, setExtras] = React.useState(extra_queries);
  const extraQueriesBox = [];
  const extrasChange = event => {
    setExtras(prevExtras => [
      ...prevExtras, {extra_query:'',extra_series:''}
    ])
  };


  const [seriesX, setSeriesX] = React.useState(chart_series_1_x);
  const seriesXChange = event => { setSeriesX(event.target.value); };

  const [seriesY, setSeriesY] = React.useState(chart_series_1_y);
  const seriesYChange = event => { setSeriesY(event.target.value); };

  const [title, setTitle] = React.useState(chart_title);
  const titleChange = event => { setTitle(event.target.value); };

  const [count, setCount] = React.useState(chart_count);
  const countChange = event => { setCount(event.target.value); };

  const generateKey = (pre) => {
      return `${ pre }_${ new Date().getTime() }`;
  }

  function alertError(data,count,chart) {
    if (data.head.vars.length === 1 && count != 'count'
      && (chart == 'barchart' || chart == 'linechart')) {
      alert("The query must return two variables, or you should tick the box 'count'")
    }

    if (data.head.vars.length === 1 && chart == 'scatterplot') {
      alert("The query must return two series of numeric values, called ?x and ?y")
    }

    if (data.head.vars.length > 2) {
      alert("The query must return two variables")
    }

    if ((!data.head.vars.includes('label') || !data.head.vars.includes('count'))
      && (chart == 'barchart' || chart == 'linechart')) {
      alert("The query must return two variables, called ?label and ?count")
    }

    if ((!data.head.vars.includes('x') || !data.head.vars.includes('y'))
      && chart == 'scatterplot') {
      alert("The query must return two series of numeric values, called ?x and ?y")
    }
  }

  function count_grouping(arr) {
      let elCount = {};
      for (const item of arr) {
        if (elCount[item]) { elCount[item] += 1;}
        else { elCount[item] = 1; }
      } return elCount;
  }


  function arrayToString(labelsArray) {
      var labelsString = '';
      labelsArray.forEach(el => {
          var newString = '"' + el + '",';
          labelsString = labelsString + newString;
      }); return labelsString
  }

  function exportChart(position) {
      var export_btn = document.getElementById('export_' + position);
      let type, labels, data, label;
      if (chart == 'barchart') { type = 'bar'}
      else if (chart == 'linechart') {type = 'line'}
      else if (chart == 'doughnutchart') { type = 'doughnut'}
      else if (chart == 'scatterplot') { type = 'scatter'}

      var chartURL = 'https://quickchart.io/chart?\
          c={type:"' + type + '",\
          data:{\
            labels:[' + labels + '],\
            datasets:[{label:"' + label + '", data:[' + data + ']}]\
          }\
        }'

      window.prompt("Copy to clipboard: Ctrl+C, Enter", '<embed type="image/jpg" src="' + encodeURI(chartURL) + '">');
  }

  function basic_chart(el_id, ch_type, series, color, chartData, chartLabels, x=undefined, y=undefined, extras=undefined) {
    let chartId = document.getElementById(el_id).getContext('2d');
    console.log("hello",ch_type, series, color, chartData, chartLabels, x, y, extras);
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
      console.log("doug");
      var colors = d3.quantize(d3.interpolateHcl(datastory_data.color_code[0], datastory_data.color_code[1]), chartLabels.length )
      ch_type = 'doughnut';
      datasets = [{
          data: chartData,
          backgroundColor: colors
      }];
      options = {
          responsive: true,
          maintainAspectRatio: true,
          legend: { position: 'right'},
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
    else if (ch_type == 'scatterplot' && !extras) {
      ch_type = 'scatter';
      datasets = [{
          label: series,
          data: chartData,
          backgroundColor: datastory_data.color_code[0]
      }];
      options = {
          responsive: true,
          legend: { position: 'top', },
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
          }

      }
    }

    if (!extras || !extras.length) {
      basicChart = new Chart(chartId, {
        type: ch_type,
        data: {
          labels: chartLabels,
          datasets: datasets},
        options: options
      });

      //let img = function () { image = basicChart.toBase64Image(); }

      // basicChart.options.animation.onComplete = img;
      // basicChart.update();

    }
    else {
      //$('#loader').removeClass('hidden');
      let labels = [] , queries = [] , title = "", x ='', y='';
      let scatterChart;
      datastory_data.dynamic_elements.forEach(element => {
        if (element.type == 'chart' && element.position == index) {
          queries.push(element.chart_query)
          labels.push(element.chart_series)
          title = element.chart_title;
          y = element.chart_legend.y;
          x = element.chart_legend.x;
          element.extra_queries.forEach(el => {
            queries.push(el.extra_query)
            labels.push(el.extra_series)
          })
        }
      });

      let colors = d3.quantize(d3.interpolateHcl(datastory_data.color_code[0], datastory_data.color_code[1]), queries.length);

      let ch_type = 'scatter';
      let promises = [];
      queries.forEach((q, i) => {
        promises.push(fetch(datastory_data.sparql_endpoint+'?query='+encodeURIComponent(q),
          { method: 'GET', headers: { 'Accept': 'application/sparql-results+json' }}
        ))
      })

      Promise.all(promises)
      .then(function (responses) {
      return Promise.all(responses.map(function (response) {
    		return response.json();
    	}));})
      .then(function (resultdata) {
        let datasets = [];
        resultdata.forEach((data,i) => {
          let dataset = {}, seriesData = [], seriesLabels = [];
          if (data.head.vars.includes('x')
           && data.head.vars.includes('y')) {
            data.results.bindings.forEach(element => {
              const xValue = parseInt(element.x.value);
              const yValue = parseInt(element.y.value);
              const entryObj = { x: xValue, y: yValue }
              seriesLabels.push(xValue);
              seriesData.push(entryObj);
            });
            dataset.label = labels[i];
            dataset.data = seriesData;
            dataset.backgroundColor = colors[i];
            datasets.push(dataset);
         }
       });
        return datasets
      })
      .then(function(datasets) {
        let chartId = document.getElementById(index+'__chartid').getContext('2d');

        scatterChart = new Chart(chartId, {
            type: ch_type,
            data: {datasets: datasets},
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top',},
                    title: { display: true, text: title }
                },
                scales: {
                    yAxes: [{
                        scaleLabel: { display: true, labelString: y},
                        beginAtZero: true
                    }],
                    xAxes: [{
                        scaleLabel: { display: true, labelString: x},
                        ticks: { autoSkip: false }
                    }]
                },
                animation: {
                  onComplete: function () {
                    image = scatterChart.toBase64Image();
                  },
                }
            }
        });

      })
      .catch(function (error) {console.log(error);})
      //.finally( () => {$('#loader').addClass('hidden')});
      // end cp
    }

  }

  function printChart(position) {
      let print_btn = document.getElementById('print_' + position);
      console.log(print_btn);
      print_btn.href = image;
      print_btn.download = 'chart.png';
  }

  const fetchQuery = event => {
    if (query.length > 1) {
      // FETCH DATA
      //$('#loader').removeClass('hidden');
      fetch(datastory_data.sparql_endpoint+'?query='+encodeURIComponent(query),
        {
        method: 'GET',
        headers: { 'Accept': 'application/sparql-results+json' }
        }
      ).then((res) => res.json())
       .then((data) => {
         alertError(data,count,chart);
         // empty the chart container
         document.getElementById(index+"__chartcontainer").innerHTML = '&nbsp;';
         document.getElementById(index+"__chartcontainer").innerHTML = '<canvas id="'+index+'__chartid"></canvas>';
         if (chart == 'barchart' || chart == 'linechart' || chart == 'doughnutchart' || chart == 'scatterplot' ) {
           let chartData = [], chartLabels = [];

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

           
           else {
             if (data.head.vars.includes('count')
              && data.head.vars.includes('label')
              && (chart == 'barchart' || chart == 'linechart')) {
               data.results.bindings.forEach(element => {
                 chartData.push(element.count.value)
                 chartLabels.push(element.label.value)
               });
             }
             // scatterplot, one series
             if (data.head.vars.includes('x')
              && data.head.vars.includes('y')
              && chart == 'scatterplot') {
               data.results.bindings.forEach(element => {
                 const xValue = parseInt(element.x.value);
                 const yValue = parseInt(element.y.value);
                 const entryObj = { x: xValue, y: yValue }
                 chartLabels.push(xValue);
                 chartData.push(entryObj);
               });
             }

           }

           if (chartData.length && chartLabels.length) {
             let el_id  = index+'__chartid' ,
                ch_type = chart ,
                ch_series = series,
                color   = datastory_data.color_code[0],
                x       = seriesX ,
                y       = seriesY ;
             basic_chart(el_id, ch_type, series, color, chartData, chartLabels, x, y, extras)
           }
         }
        })
       .catch((error) => {
          console.error('Error:', error);
       })
       //.finally( () => {$('#loader').addClass('hidden')});
    }
  }

  // preview
  React.useEffect(() => {
     fetchQuery();
     if (window.location.href.indexOf("/modify/") > -1) {
       let ch_type = document.getElementById(index+'__chart_type').value
       add_series_btn(index,ch_type);
     }
  }, []);

  if (extras) {
    for (let i = 0; i < extras.length; i++) {
      extraQueriesBox.push(<ExtraSeries
          indexExtra={i} key={generateKey(extras[i].extra_query)+i}
          index_parent={index} setExtras={setExtras} extras={extras}/>)
    }
  }
  // modal examples

  // WYSIWYG: render component and preview
  if (window.location.href.indexOf("/modify/") > -1) {
    return (
    <div id={index+"__block_field"} className="block_field">
      <h4 className="block_title">Add a chart</h4>
      <SortComponent
        index={index}
        sortComponentUp={sortComponentUp}
        sortComponentDown={sortComponentDown}
        key={unique_key} />
      <RemoveComponent
        index={index}
        removeComponent={removeComponent}
        key={unique_key} />
        <h3 className="block_title">{title}</h3>
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

          <div id={index+"__action1"}>
            <label>Operations</label><br/>
    				<input type='checkbox'
                  id='count'
                  name={index+"__action1"}
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

          <a id={index+"__query-btn"}
            style={{display: 'none'}}
            className='btn btn-primary btn-border'
            onClick={extrasChange}
            extra='True'
            name={index+"__query-btn"}>Add a series</a>
          {extraQueriesBox}
  			</div>
    </div>
    );
  } else {
    // Final story: render preview
    return (
      <>
        <h3 className="block_title">{title}</h3>
        <input id={index+"__chart_type"} type='hidden' value={chart}></input>
        <div id={index+"__chartcontainer"} className='chart-container'>
          <canvas id={index+"__chartid"}></canvas>
        </div>
        <div className="exportchart card-tools col-md-12 col-sm-12">
          <a id={"export_"+index}
            className="btn btn-info btn-border btn-round btn-sm mr-2"
            onClick={() => exportChart(index)}>
            Embed
          </a>
          <a id={"print_"+index}
            className="btn btn-info btn-border btn-round btn-sm mr-2"
            onClick={() => printChart(index)}>
            Save
          </a>
          <a role="button" data-toggle="modal" data-target={"#queryModal_"+index}
            id={"sparqlQuery_"+index} className="btn btn-info btn-border btn-round btn-sm">
            Query
          </a>
        </div>
      </>

    );
  }
}
