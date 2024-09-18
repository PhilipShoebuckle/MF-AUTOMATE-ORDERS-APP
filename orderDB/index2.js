const sql = require('mssql/msnodesqlv8');
const fs = require('fs');
const {errdict, transdict} = require('./desc');

var config = {
    connectionString: 'Driver=SQL Server;Server=LAPTOP-JVV3CIQU\\SQLEXPRESS;Database=OrdersDB;Trusted_Connection=true;'
};

function compDates(dt1, dt2) {
    const t1 = new Date(dt1).getTime();
    const t2 = new Date(dt2).getTime();
    return t1 > t2;
}

function uploadDataFromFolder(path, cl, se, ldt) {
    try {
        let arr, text, query = '', epochs, epoch;
        let dt, server;
        let si, clordid;
        let i, c, str, curr, prev = 0;

        fs.readdirSync(path).forEach(folder => {
            //dt, cl, se, server, si, clordid, exordid, security, code, series, stream, buysell, price, quantity, tstatus, timegap,
            //thandler, trigresp, omsdebugts, reqsttime, timestmp3, recvtime, transcode, transdesc, errcode, errdesc
            server = folder.charAt(1);
            if (folder.indexOf("Oms_Debug_Log") != -1) {
                epochs = [];
                fs.readdirSync(path + '\\' + folder).forEach(file => {
                    dt = `${file.slice(0, 4)}-${file.slice(5, 7)}-${file.slice(8, 10)}`;
                    if (compDates(dt, ldt) && file.indexOf("oms_debug") != -1 && file.indexOf("oms_debug_filtered") == -1) {
                        text = fs.readFileSync(path + '\\' + folder + '\\' + file, 'utf8').split("\n");
                        for(let i=0; i < text.length; i++) {
                            if(text[i].indexOf("EPOCH@9") != -1) {
                                text[i] = text[i].slice(text[i].indexOf("EPOCH@9"), text[i].length);
                                epochs.push(text[i].slice(8, text[i].indexOf(" ")));
                                break;
                            }
                        }
                    }
                    else if (compDates(dt, ldt) && file.indexOf("oms_debug_filtered") != -1) {
                        //initial insert (dt, cl, se, server, si, clordid, epochat9, omsdebugts, thandler, trigresp, timegap)
                        si=1;
                        epoch = BigInt(epochs[epochs.length-1]);
                        text = fs.readFileSync(path + '\\' + folder + '\\' + file, 'utf8').split("\n");
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
                                clordid = ((si-1) + 10000).toString();
                                str = epoch.toString();
                                query += `INSERT INTO Orders ([dt], [cl], [se], [server], [si], [clordid], [epochat9_1], [epochat9_2], [omsdebugts1], [omsdebugts2], [thandler1], [thandler2], [timegap]) VALUES ('${dt}', '${cl}', '${se}', '${server}', '${si}', '${clordid}', '${str.slice(0, 4)}', '${str.slice(4, str.length)}', '${arr[0]}', '${arr[1]}', '${arr[2]}', '${arr[3]}', '${arr[4]}');\n`;
                                si++;
                                prev = BigInt(curr);
                            }
                            else if(clordid != '' && clordid != '0') {
                                query += `UPDATE Orders SET trigresp1='${arr[2]}' , trigresp2='${arr[3]}' WHERE (dt='${dt}' AND cl='${cl}' AND se='${se}' AND server='${server}' AND clordid='${clordid}');\n`;
                            }
                        });
                        console.log(`${si-1} rows added!`);
                    }
                });
            }

            else if(folder.indexOf("Parsed_Onload_Pcap") != -1) {
                i = 0;
                fs.readdirSync(path + '\\' + folder).forEach(file => {
                    dt = `${file.slice(0, 4)}-${file.slice(5, 7)}-${file.slice(8, 10)}`;
                    if (compDates(dt, ldt) && file.indexOf("request") != -1) {
                        //reqsttime, security, series, code, bs, quantity, price
                        epoch = BigInt(epochs[i]);
                        text = fs.readFileSync(path + '\\' + folder + '\\' + file, 'utf8').split("\n");
                        text.forEach(line => {
                            arr = [];

                            line = line.slice(line.indexOf(" "), line.length);
                            c = line.charAt(8);
                            line = line.slice(line.indexOf("."), line.length);
                            if (c != '9') str = (epoch + BigInt(line.slice(1, line.indexOf(" ")))).toString();
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
                                query += `UPDATE Orders SET reqsttime1='${arr[0]}' , reqsttime2='${arr[1]}' , security='${arr[2]}' , series='${arr[3]}' , code='${arr[4]}' , buysell='${arr[5]}' , quantity='${arr[6]}' , price='${arr[7]}' WHERE (dt='${dt}' AND cl='${cl}' AND se='${se}' AND server='${server}' AND clordid='${clordid}');\n`;
                            }
                        });
                    }

                    else if (compDates(dt, ldt) && file.indexOf("response") != -1) {
                        //recvtime, transcode, transdesc, errcode, errdesc, tstatus, exordid, strm, timestmp3
                        epoch = BigInt(epochs[i]);
                        text = fs.readFileSync(path + '\\' + folder + '\\' + file, 'utf8').split("\n");
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
                                query += `UPDATE Orders SET recvtime1='${arr[0]}' , recvtime2='${arr[1]}' , transcode='${arr[2]}' , transdesc='${arr[3]}' , errcode='${arr[4]}' , errdesc='${arr[5]}' , tstatus='${arr[6]}' , exordid1='${arr[7]}' , exordid2='${arr[8]}' , stream='${arr[9]}' , timestmp3_1='${arr[10]}' , timestmp3_2='${arr[11]}' WHERE (dt='${dt}' AND cl='${cl}' AND se='${se}' AND server='${server}' AND clordid='${clordid}');\n`;
                            }
                        });
                        i++;
                    }
                });
            }
        });
        // await sql.connect(config);
        // const result = await new sql.Request().query(query);
        // console.log(result);
        query += dt;
        return query;
    } catch (err) {
        console.error("Error in uploadDataFromFolder:", err);
    }
}

async function uploadData(path) {
    try {
        let dt; //will be saved as ldt for next
        let cl, se, ldt='2024-01-10', query = '', temp;
        fs.readdirSync(path).forEach(folder => {
            if (folder.indexOf("Client") != -1 && (folder.indexOf("NSE") != -1 || folder.indexOf("BSE") != -1)) {
                temp = folder.slice(folder.indexOf("Client"), folder.length);
                cl = temp.charAt(6);
                if (folder.indexOf("NSE") != -1) se = 'NSE';
                else se = 'BSE';
                temp = uploadDataFromFolder(path + '\\' + folder, cl, se, ldt);
                dt = temp.slice(temp.length-10, temp.length);
                query += temp.slice(0, temp.length-10);
            }
        });
        console.log(`last date: ${dt}`);
        await sql.connect(config);
        const result = await new sql.Request().query(query);
        console.log(result);
    } catch (error) {
        console.error('Error in uploadData: ', error);
    }
}

(async () => {
    try {
        await uploadData('C:\\Users\\anony\\Documents\\Internship\\MF_Data');
    } catch (error) {
        console.error('Error:', error);
    }
})();
