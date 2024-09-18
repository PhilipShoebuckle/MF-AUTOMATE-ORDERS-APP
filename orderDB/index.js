//LAPTOP-JVV3CIQU\SQLEXPRESS
const sql = require('mssql/msnodesqlv8');
const fs = require('fs');
const {errdict, transdict} = require('./desc');

var config = {
    connectionString: 'Driver=SQL Server;Server=LAPTOP-JVV3CIQU\\SQLEXPRESS;Database=OrdersDB;Trusted_Connection=true;'
};



async function viewData() {
    try {
        await sql.connect(config);
        const result = await new sql.Request().query(`SELECT * FROM Orders`);
        console.log(result);
    } catch (err) {
        console.error("Error in viewData:", err);
    }
}


async function clearData() {
    try {
        await sql.connect(config);
        const result = await new sql.Request().query(`DELETE FROM Orders`);
        console.log(result);
    } catch (err) {
        console.error("Error in clearData: ", err);
    }
}

async function deleteData(clmnNm) {
    try {
        await sql.connect(config);
        const result = await new sql.Request().query(`DELETE FROM Orders WHERE name='${clmnNm}'`);
        console.log(result);
    } catch (err) {
        console.error("Error in deleteData: ", err);
    }
}

async function editData() {
    try {
        await sql.connect(config);
        const result = await new sql.Request().query(`UPDATE Orders SET series='AB' WHERE (dt='2024-01-12' AND si='1')`);
        console.log(result);
    } catch (err) {
        console.error("Error in editData: ", err);
    }
}

async function singleInsert() {
    try {
        await sql.connect(config);
        const result = await new sql.Request().query(`INSERT INTO Orders ([dt], [si], [token]) VALUES ('2024-01-10', '1', '9999')
        INSERT INTO Orders ([dt], [si], [token]) VALUES ('2024-01-11', '1', '8888')`);
        console.log(result);
    } catch (err) {
        console.error("Error in editData: ", err);
    }
}

async function uploadDataFromFolder(path) {
    try {
        let arr, text, query = '', type;
        let dt='2024-01-10', cl=1, se='BSE';
        let si=1, clordid, epoch = 1704857400000000000n;
        let b=1, c, str, curr, prev = 0;
        const dataF = fs.readdirSync(path);

        dataF.forEach(file => {
            //dt, si, clordid, exordid, symbol, token, series, strm, bs, price, quantity, tstatus, tgap,
            //thandler, trigresp, omsdebugts, reqtime, ts3, recvtime, transcode, transdesc, errcode, errdesc
            text = fs.readFileSync(path + '\\' + file, 'utf8').split("\n");

            if (text[0].indexOf("error_code") != -1) type = 'resp';
            else if(text[0].indexOf("OrderID") != -1) type = 'oms';
            else type = 'req';

            //initial insert (dt, cl, se, si, clordid, epochat9)
            if (b) {
                str = epoch.toString();
                if (type === 'req' || type === 'resp') {
                    text.forEach(line => {
                        line = line.slice(line.indexOf("transac_id"), line.length);
                        clordid = line.slice(11, line.indexOf(" "));
                        if (clordid != '') {
                            query += `INSERT INTO Orders ([dt], [cl], [se], [si], [clordid], [epochat9_1], [epochat9_2]) VALUES ('${dt}', '${cl}', '${se}', '${si}', '${clordid}', '${str.slice(0, 4)}', '${str.slice(4, str.length)}');\n`;
                            si++;
                        }
                    })
                }
                else {
                    text.forEach(line => {
                        line = line.slice(line.indexOf("OrderID"), line.length);
                        clordid = line.slice(8, line.indexOf(" "));
                        if (clordid != '' && clordid != '0') {
                            query += `INSERT INTO Orders ([dt], [cl], [se], [si], [clordid], [epochat9_1], [epochat9_2]) VALUES ('${dt}', '${cl}', '${se}', '${si}', '${clordid}', '${str.slice(0, 4)}', '${str.slice(4, str.length)}');\n`;
                            si++;
                        }
                    })
                }
                b=0;
            }

            if (type === 'req') {
                //reqsttime, security, series, code, bs, quantity, price
                text.forEach(line => {
                    arr = [];

                    line = line.slice(line.indexOf(" "), line.length);
                    c = line.charAt(2);
                    line = line.slice(line.indexOf("."), line.length);
                    if (c === '9') str = (epoch + BigInt(line.slice(1, line.indexOf(" ")))).toString();
                    else str = (epoch + BigInt(line.slice(1, line.indexOf(" "))) - BigInt(1000000000)).toString();
                    arr.push(str.slice(0, 4));
                    arr.push(str.slice(4, str.length));

                    line = line.slice(line.indexOf("symbol"), line.length);
                    arr.push(line.slice(7, line.indexOf(" ")));

                    line = line.slice(line.indexOf("series"), line.length);
                    arr.push(line.slice(7, line.indexOf(" ")));

                    line = line.slice(line.indexOf("token"), line.length);
                    arr.push(line.slice(6, line.indexOf(" ")));

                    line = line.slice(line.indexOf("buy_sell"), line.length);
                    arr.push(line.slice(9, line.indexOf(" ")));

                    line = line.slice(line.indexOf("volume"), line.length);
                    arr.push(line.slice(7, line.indexOf(" ")));

                    line = line.slice(line.indexOf("price"), line.length);
                    arr.push(line.slice(6, line.indexOf(" ")));

                    line = line.slice(line.indexOf("transac_id"), line.length);
                    clordid = line.slice(11, line.indexOf(" "));

                    if(clordid != '') {
                        query += `UPDATE Orders SET reqsttime1='${arr[0]}' , reqsttime2='${arr[1]}' , security='${arr[2]}' , series='${arr[3]}' , code='${arr[4]}' , buysell='${arr[5]}' , quantity='${arr[6]}' , price='${arr[7]}' WHERE (dt='${dt}' AND cl='${cl}' AND se='${se}' AND clordid='${clordid}');\n`;
                    }
                });
            }

            else if (type === 'resp') {
                //recvtime, transcode, transdesc, errcode, errdesc, tstatus, exordid, strm, timestmp3
                text.forEach(line => {
                    arr = [];

                    line = line.slice(line.indexOf(" "), line.length);
                    c = line.charAt(2);
                    line = line.slice(line.indexOf("."), line.length);
                    if (c === '9') str = (epoch + BigInt(line.slice(1, line.indexOf(" ")))).toString();
                    else str = (epoch + BigInt(line.slice(1, line.indexOf(" "))) - BigInt(1000000000)).toString();
                    arr.push(str.slice(0, 4));
                    arr.push(str.slice(4, str.length));

                    line = line.slice(line.indexOf("trans_code"), line.length);
                    str = line.slice(11, line.indexOf(" "))
                    arr.push(str);
                    
                    arr.push(transdict[str]);

                    line = line.slice(line.indexOf("error_code"), line.length);
                    str = line.slice(11, line.indexOf(" "));
                    arr.push(str);

                    arr.push(errdict[str]);

                    if (str != '0') arr.push("Reject");
                    else arr.push("Ord Confirm");

                    line = line.slice(line.indexOf("ord_num"), line.length);
                    str = line.slice(8, line.indexOf(" "));
                    arr.push(str.slice(0, 12));
                    arr.push(str.slice(12, str.length));

                    if (str.charAt(1) === '0') arr.push('1');
                    else if (str.charAt(1) === '1') arr.push('2');
                    else if (str.charAt(1) === '2') arr.push('3');
                    else if (str.charAt(1) === '3') arr.push('4');
                    else if (str.charAt(1) === '4') arr.push('5');

                    line = line.slice(line.indexOf("transac_id"), line.length);
                    clordid = line.slice(11, line.indexOf(" "));

                    line = line.slice(line.indexOf("time_stamp3"), line.length);

                    line = line.slice(line.indexOf(" "), line.length);
                    c = line.charAt(2);
                    line = line.slice(line.indexOf("."), line.length);
                    if (c === '9') str = (epoch + BigInt(line.slice(1, line.indexOf(" ")))).toString();
                    else str = (epoch + BigInt(line.slice(1, line.indexOf(" "))) - BigInt(1000000000)).toString();
                    arr.push(str.slice(0, 4));
                    arr.push(str.slice(4, str.length));

                    if(clordid != '') {
                        query += `UPDATE Orders SET recvtime1='${arr[0]}' , recvtime2='${arr[1]}' , transcode='${arr[2]}' , transdesc='${arr[3]}' , errcode='${arr[4]}' , errdesc='${arr[5]}' , tstatus='${arr[6]}' , exordid1='${arr[7]}' , exordid2='${arr[8]}' , stream='${arr[9]}' , timestmp3_1='${arr[10]}' , timestmp3_2='${arr[11]}' WHERE (dt='${dt}' AND cl='${cl}' AND se='${se}' AND clordid='${clordid}');\n`;
                    }
                });
            }

            else {
                //omsdebugts, thandler, trigresp, timegap
                si = 0;
                text.forEach(line => {
                    arr = [];

                    line = line.slice(line.indexOf(":"), line.length);
                    c = line.charAt(1);
                    line = line.slice(line.indexOf("."), line.length);
                    if (c === '0') str = (epoch + BigInt(line.slice(1, line.indexOf(" ")))).toString();
                    else str = (epoch + BigInt(line.slice(1, line.indexOf(" "))) - BigInt(1000000000)).toString();
                    arr.push(str.slice(0, 4));
                    arr.push(str.slice(4, str.length));

                    line = line.slice(line.indexOf("OrderID"), line.length);
                    clordid = line.slice(8, line.indexOf(" "));

                    line = line.slice(line.indexOf("TradeHanderCurrentTime"), line.length);
                    curr = line.slice(23, line.indexOf(" "));
                    arr.push(curr.slice(0, 4));
                    arr.push(curr.slice(4, curr.length));
                    
                    if (prev === 0) arr.push("202");
                    else arr.push((BigInt(curr)-prev).toString());

                    if(clordid === '0') {
                        clordid = (si + 10000).toString();
                        query += `UPDATE Orders SET omsdebugts1='${arr[0]}' , omsdebugts2='${arr[1]}' , thandler1='${arr[2]}' , thandler2='${arr[3]}' , timegap='${arr[4]}' WHERE (dt='${dt}' AND cl='${cl}' AND se='${se}' AND clordid='${clordid}');\n`;
                        si++;
                        prev = BigInt(curr);
                    }
                    else if(clordid != '' && clordid != '0') {
                        query += `UPDATE Orders SET trigresp1='${arr[2]}' , trigresp2='${arr[3]}' WHERE (dt='${dt}' AND cl='${cl}' AND se='${se}' AND clordid='${clordid}');\n`;
                    }
                });
            }
        });
        console.log(query);
        await sql.connect(config);
        const result = await new sql.Request().query(query);
        console.log(result);
    } catch (err) {
        console.error("Error in uploadDataFromFolder:", err);
    }
}

(async () => {
    try {
        await clearData();
        // await uploadDataFromFolder('C:\\Users\\anony\\Documents\\Internship\\orderDB\\data');
        // await viewData();
    } catch (error) {
        console.error('Error:', error);
    }
})();
