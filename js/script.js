
function table () {
    var file = document.getElementById("data").files[0];
    reader = new FileReader();
    reader.readAsText(file);
    reader.onload = function(event) {
        data = reader.result.replace(/,/g, ".").split("\r\n");
        
        var infos = data[0].split("\t");
        document.getElementById("name").innerHTML = infos[0] + " " + infos[1];
        document.getElementById("StepsReceived").innerHTML = "Nombre d'échantillons : " + infos[2];
        document.getElementById("stpd").innerHTML = "STPD : " + infos[5];
        document.getElementById("age").innerHTML = "Âge : " + infos[7];
        document.getElementById("gender").innerHTML = "Sexe : " + infos[8].substring(2);
        document.getElementById("height").innerHTML = "Taille (cm) : " + infos[10];
        document.getElementById("weight").innerHTML = "Poids (kg) : " + infos[12];
        document.getElementById("cf").innerHTML = "Fc max (bpm) : " + infos[14];

        var columns = ["fr","ve","vo2","vo2Kg","feo2","phase","fc",
            "pa","charge","vitesse","pente","taSys","taDia","cve"/*,"ifp","gain","kmix"*/];

        var tableData = generateTableData(data.slice(3), columns);

        for (let i = 0; i < tableData.time.minutes.length; i++) {
            generatehtmlTable(tableData, i, columns);
        }

        graphs(tableData);
    };
}

function generateTableData(data, columns) {

    var tableData = {
        "time": {
            "minutes": [],
            "seconds": []
        },
        "fr": [],
        "ve": [],
        "vo2": [],
        "vo2Kg": [],
        "feo2": [],
        "phase": [],
        "fc": [],
        "pa": [],
        "charge": [],
        "vitesse": [],
        "pente": [],
        "taSys": [],
        "taDia": [],
        "cve": [],
        "ifp": [],
        "gain": [],
        "kmix": []
    };

    var indexAverage = 0;
    var dataAverage = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    var wasOver30 = false;

    for(var i = 0; i < data.length; i++) {
        var row = data[i].split("\t");
        var seconds = parseInt(row[0].substring(6,8));
        

        if (wasOver30 && seconds < 30) {
            
            wasOver30 = false;

            for (let j = 0; j < columns.length; j++) {
                tableData[columns[j]].push(Math.round((dataAverage[j] / indexAverage) * 100) / 100);
                
            }

            tableData.time.seconds.push("00");
            tableData.time.minutes.push(tableData.time.minutes[tableData.time.minutes.length -1] + 1);

            var indexAverage = 0;
            var dataAverage = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

        } else if (!wasOver30 && seconds >= 30) {

            wasOver30 = true;

            tableData.time.seconds.push(30);

            if (tableData.time.minutes[tableData.time.minutes.length -1] + 1) {
                tableData.time.minutes.push(tableData.time.minutes[tableData.time.minutes.length -1]);
            } else {
                tableData.time.minutes.push(0);
            }

            for (let j = 0; j < columns.length; j++) {
                tableData[columns[j]].push(Math.round((dataAverage[j] / indexAverage) * 100) / 100);
            }

            var indexAverage = 0;
            var dataAverage = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
        }

        for(var j = 0; j < row.length - 1; j++) {
            dataAverage[j] += parseFloat(row[j + 1]);
        }

        ++indexAverage;
    }

    return tableData;
}

function generatehtmlTable(tableData, i, columns) {
    var table = document.getElementById("table");
    var newRow = table.insertRow(-1);
    newRow.className = "row100";

    var newCell = [];

    for (let j = 0; j < columns.length + 1; j++) {
        newCell[j] = newRow.insertCell(j);
        newCell[j].className = "column100 column" + (j + 1);
        newCell[j].setAttribute("data-column", "column" + (j + 1));
        if (j == 0) {
            newCell[j].innerHTML = tableData.time.minutes[i] + " : " + tableData.time.seconds[i];
        } else {
            newCell[j].innerHTML = tableData[columns[j - 1]][i];
        }
    }
    var newCellCalc = newRow.insertCell(15);
    newCellCalc.innerHTML = Math.round((tableData.ve[i] / tableData.vo2[i]) * 10000) / 100
    newCellCalc.setAttribute("data-column", "column16");
    newCellCalc.className = "column100 column16";
}

/***************************************************************** */

function graphs(tableData) {

    var time = [];

    for (let i = 0; i < tableData.time.minutes.length; i++) {
        time.push("" + tableData.time.minutes[i] + " : " + tableData.time.seconds[i]);
    }

    var ctx = document.getElementById("graphs").getContext('2d');

    var graph = new Chart(ctx, {
        type: 'line',
        data: {
            labels: time,
            datasets: [
                {
                    label: "fR",
                    data: tableData.fr,
                    yAxisID: "other",
                    borderColor: "rgba(255, 0, 0, 1)"
                },
                {
                    label: "VE",
                    data: tableData.ve,
                    yAxisID: "other",
                    borderColor: "rgba(0, 255, 0, 1)"
                },
                {
                    label: "VO2/KG",
                    data: tableData.vo2Kg,
                    yAxisID: "vo2",
                    borderColor: "rgba(0, 0, 255, 1)"
                },
                {
                    label: "FC",
                    data: tableData.fc,
                    yAxisID: "other",
                    borderColor: "rgba(255, 0, 255, 1)"
                }
                
            ]
        },
        options: {
            scales: {
                yAxes: [
                    {
                        id: "vo2",
                        type: "linear",
                        position: "right",
                        ticks: {
                            beginAtZero:true
                        }
                    },
                    {
                        id: "other",
                        type: "linear",
                        ticks: {
                            beginAtZero:true
                        }
                    }
                ]
            }
        }
    });

    var ctx2 = document.getElementById("vevo2feo2").getContext('2d');

    vevo2 = [];

    for(i = 0; i < tableData.vo2.length; i++) {
        vevo2.push(Math.round((tableData.ve[i] / tableData.vo2[i]) * 10000) / 100);
    }

    var vevo2feo2 = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: time,
            datasets: [
                {
                    label: "FeO2",
                    data: tableData.feo2,
                    yAxisID: "feo2",
                    borderColor: "rgba(255, 0, 255, 1)"
                },
                {
                    label: "VE/VO2",
                    data: vevo2,
                    yAxisID: "vevo2",
                    borderColor: "rgba(255, 255, 0, 1)"
                },
                {
                    label: "FC",
                    data: tableData.fc,
                    yAxisID: "other",
                    borderColor: "rgba(255, 0, 0, 1)"
                }
            ]
        },
        options: {
            scales: {
                yAxes: [
                    {
                        id: "vevo2",
                        type: "linear",
                        ticks: {
                            beginAtZero:true
                        },
                        position: "right"
                    },
                    {
                        id: "feo2",
                        type: "linear",
                        ticks: {
                            beginAtZero:false
                        }
                    },
                    {
                        id: "other",
                        type: "linear",
                        ticks: {
                            beginAtZero:true
                        }
                    }
                ]
            }
        }
    });
}