window.onload = function () {
    counter();
}

function counter() {
    if (data.count) {
        data.count.forEach(element => {
            var query = element.query;
            // check if the query is an API request
            if (query.startsWith('http')) {
                alert('There is an API request.');
                // $.ajax({
                //     type: 'GET',
                //     url: query,
                //     headers: {Accept: 'application/json'},
                //     success: function (returnedJson) {
                //         do things
                //     }
                // }
            } else {
                // if it is a sparql query
                var encoded = encodeURIComponent(query);
                var sparqlEndpoint = data.sparql_endpoint;
                var label = element.label;
                $.ajax({
                    type: 'GET',
                    url: sparqlEndpoint + '?query=' + encoded,
                    headers: { Accept: 'application/sparql-results+json; charset=utf-8' },
                    success: function (returnedJson) {
                        for (i = 0; i < returnedJson.results.bindings.length; i++) {
                            var count = returnedJson.results.bindings[i].count.value;
                            // create div to set the column
                            var generalDiv = document.createElement("div");
                            generalDiv.className = "col-lg-4";
                            // create div to contain number and label
                            var countDiv = document.createElement("div");
                            countDiv.className = "card-body option-2b";
                            countDiv.appendChild(document.createTextNode(count));
                            generalDiv.appendChild(countDiv);
                            // create and append p for label
                            var labelP = document.createElement("p");
                            labelP.appendChild(document.createTextNode(label));
                            countDiv.appendChild(labelP);

                            // get container and append
                            var container = document.getElementById("count_container");
                            container.appendChild(generalDiv);
                        }
                    }
                })
            }
        })
    } else {
        alert("No COUNT found.");
    }
}