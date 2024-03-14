"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const backpack_client_1 = require("./backpack_client");
require('dotenv').config();

function delay(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

//当前年份日期时分秒
function getNowFormatDate() {
    var date = new Date();
    var seperator1 = "-";
    var seperator2 = ":";
    var month = date.getMonth() + 1;
    var strDate = date.getDate();
    var strHour = date.getHours();
    var strMinute = date.getMinutes();
    var strSecond = date.getSeconds();
    if (month >= 1 && month <= 9) {
        month = "0" + month;
    }
    if (strDate >= 0 && strDate <= 9) {
        strDate = "0" + strDate;
    }
    if (strHour >= 0 && strHour <= 9) {
        strHour = "0" + strHour;
    }
    if (strMinute >= 0 && strMinute <= 9) {
        strMinute = "0" + strMinute;
    }
    if (strSecond >= 0 && strSecond <= 9) {
        strSecond = "0" + strSecond;
    }
    var currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate
        + " " + strHour + seperator2 + strMinute
        + seperator2 + strSecond;
    return currentdate;
}

let successbuy = 0;
let sellbuy = 0;

const init = async (client) => {
    try {
        console.log(`Số lần mua hàng thành công:${successbuy}, Số lần bán hàng thành công:${sellbuy}`);
        console.log(getNowFormatDate(), "đợi 3 giây...");
        await delay(3000);
        console.log(getNowFormatDate(), "Truy xuất thông tin tài khoản...");
        let userbalance = await client.Balance();
        //判断账号USDC余额是否大于5
        if (userbalance.USDC.available > 5) {
            console.log('Chuẩn bị mua');
            await buyfun(client);
        } else {
            console.log('Chuẩn bị bán');
            await sellfun(client);
            return;
        }
    } catch (e) {
        init(client);
        console.log(getNowFormatDate(), "Lệnh chờ xử lý không thành công, lệnh đang được đặt lại....");
        await delay(1000);
    }
}



const sellfun = async (client) => {
    //Hủy tất cả các đơn hàng đang tồn đọng
    let GetOpenOrders = await client.GetOpenOrders({ symbol: "SOL_USDC" });
    if (GetOpenOrders.length > 0) {
        let CancelOpenOrders = await client.CancelOpenOrders({ symbol: "SOL_USDC" });
        console.log(getNowFormatDate(), "Tất cả các đơn đặt hàng đang chờ xử lý đã bị hủy");
    } else {
        console.log(getNowFormatDate(), "Lệnh tài khoản diễn ra bình thường và không cần hủy lệnh chờ xử lý.");
    }
    console.log(getNowFormatDate(), "Truy xuất thông tin tài khoản...");
    //获取账户信息
    let userbalance2 = await client.Balance();
    console.log(getNowFormatDate(), "thông tin tài khoản:", userbalance2);
    console.log(getNowFormatDate(), "Lấy giá thị trường hiện tại của sol_usdc...");
    //获取当前
    let { lastPrice: lastPriceask } = await client.Ticker({ symbol: "SOL_USDC" });
    console.log(getNowFormatDate(), "Giá thị trường hiện tại của sol_usdc:", lastPriceask);
    let quantitys = ((userbalance2.SOL.available / 2) - 0.02).toFixed(2).toString();
    console.log(getNowFormatDate(), `bán... 卖${quantitys}个SOL`);
    let orderResultAsk = await client.ExecuteOrder({
        orderType: "Limit",
        price: lastPriceask.toString(),
        quantity: quantitys,
        side: "Ask", //卖
        symbol: "SOL_USDC",
        timeInForce: "IOC"
    })

    if (orderResultAsk?.status == "Filled" && orderResultAsk?.side == "Ask") {
        console.log(getNowFormatDate(), "Đã bán thành công");
        sellbuy += 1;
        console.log(getNowFormatDate(), "chi tiết đặt hàng:", `gia ban:${orderResultAsk.price}, số lượng:${orderResultAsk.quantity}, id:${orderResultAsk.id}`);
        init(client);
    } else {
        console.log(getNowFormatDate(), "Bán không thành công", orderResultAsk.status);
        throw new Error("Bán không thành công");
    }
}

const buyfun = async (client) => {
    //取消所有未完成订单
    let GetOpenOrders = await client.GetOpenOrders({ symbol: "SOL_USDC" });
    if (GetOpenOrders.length > 0) {
        let CancelOpenOrders = await client.CancelOpenOrders({ symbol: "SOL_USDC" });
        console.log(getNowFormatDate(), "Tất cả các đơn đặt hàng đang chờ xử lý đã bị hủy");
    } else {
        console.log(getNowFormatDate(), "Lệnh tài khoản diễn ra bình thường và không cần hủy lệnh chờ xử lý.");
    }
    console.log(getNowFormatDate(), "Truy xuất thông tin tài khoản...");
    //获取账户信息
    let userbalance = await client.Balance();
    console.log(getNowFormatDate(), "thông tin tài khoản:", userbalance);
    console.log(getNowFormatDate(), "Lấy giá thị trường hiện tại của sol_usdc...");
    //获取当前
    let { lastPrice } = await client.Ticker({ symbol: "SOL_USDC" });
    console.log(getNowFormatDate(), "Giá thị trường hiện tại của sol_usdc:", lastPrice);
    console.log(getNowFormatDate(), `mua ngay... 花${(userbalance.USDC.available - 2).toFixed(2).toString()}个USDC买SOL`);
    let quantitys = ((userbalance.USDC.available - 2) / lastPrice).toFixed(2).toString();
    console.log("1024", quantitys);
    let orderResultBid = await client.ExecuteOrder({
        orderType: "Limit",
        price: lastPrice.toString(),
        quantity: quantitys,
        side: "Bid", //买
        symbol: "SOL_USDC",
        timeInForce: "IOC"
    })
    if (orderResultBid?.status == "Filled" && orderResultBid?.side == "Bid") {
        console.log(getNowFormatDate(), "đặt hàng thành công");
        successbuy += 1;
        console.log(getNowFormatDate(), "chi tiết đặt hàng:", `giá :${orderResultBid.price}, Số lượng:${orderResultBid.quantity}, id:${orderResultBid.id}`);
        init(client);
    } else {
        console.log(getNowFormatDate(), "Lệnh không thành công", orderResultBid.status);
        throw new Error("Lệnh không thành công");
    }
}

(async () => {
    const apisecret = process.env.API_SECRET;
    const apikey = process.env.API_KEY;
    const client = new backpack_client_1.BackpackClient(apisecret, apikey);
    init(client);
})()

// 卖出
// client.ExecuteOrder({
//     orderType: "Limit",
//     price: "110.00",
//     quantity: "0.36",
//     side: "Ask", //卖
//     symbol: "SOL_USDC",
//     timeInForce: "IOC"
// }).then((result) => {
//     console.log(getNowFormatDate(),result);
// })

// 买入
// client.ExecuteOrder({
//     orderType: "Limit",
//     price: "110.00",
//     quantity: "0.36",
//     side: "Bid", //买
//     symbol: "SOL_USDC",
//     timeInForce: "IOC"
// }).then((result) => {
//     console.log(getNowFormatDate(),result);
// })
