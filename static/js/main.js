window.onload = function () {
    var sparqlEndpoint = data.sparql_endpoint;
    var counts = data.count;

    counts.forEach(element => {
        var sparqlQuery = element.query;
        var encoded = encodeURIComponent(sparqlQuery);
        var label = element.label;
        $.ajax({
            type: 'GET',
            url: sparqlEndpoint + '?query=' + encoded,
            headers: { Accept: 'application/sparql-results+json; charset=utf-8' },
            success: function (returnedJson) {
                for (i = 0; i < returnedJson.results.bindings.length; i++) {
                    var count = returnedJson.results.bindings[i].count.value;
                    // create div to contain number and label
                    var generalDiv = document.createElement("div");
                    generalDiv.className = "col-lg-4";

                    var countDiv = document.createElement("div");
                    countDiv.className = "card-body option-2b";
                    countDiv.appendChild(document.createTextNode(count));

                    var labelP = document.createElement("p");
                    labelP.appendChild(document.createTextNode(label));
                    countDiv.appendChild(labelP);

                    generalDiv.appendChild(countDiv);
                    // get container and append
                    var container = document.getElementById("count_container");
                    container.appendChild(generalDiv);
                }
            }
        })
    })

}