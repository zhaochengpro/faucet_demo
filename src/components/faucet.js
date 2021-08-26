import { Component } from "react";
import {
    DollarCircleFilled,
    DatabaseFilled,
    SmileFilled
} from '@ant-design/icons'
import { message, Progress } from "antd";
import { wallet, faucetContract, provider } from "../config";
import address from '../address'
import api from '../api'
import $ from "jquery";

//format the interval
function getIntervalFormat(interval) {
    let leavel = interval % (24 * 3600 * 1000); // 计算天数后剩余的时间
    let hours = Math.floor(leavel / (3600 * 1000)); // 计算剩余的小时数
    let leavel2 = leavel % (3600 * 1000); // 计算剩余小时后剩余的毫秒数
    let minutes = Math.floor(leavel2 / (60 * 1000)); // 计算剩余的分钟数
    let leavel3 = leavel2 % (60 * 1000)
    let second = Math.floor(leavel3 / (1000))
    return { hours, minutes, second }
}
//listen to the requestTokens event 
let faucetEvent = new Promise((resolve, reject) => {
    faucetContract.connect(provider.getSigner()).on("RequestTokens", (from, to, event) => {
        event.removeListener()
        resolve({
            from: from,
            to: to,
        });
        setTimeout(() => {
            reject(new Error('timeout'));
        }, 60000)
    })
})

class Faucet extends Component {
    constructor() {
        super()
        this.state = {
            localAddress: "",
            token: null,
            totalSupply: 0,
            surplusTokenAmount: 0,
            tokenAmount: 0,
            blocks: 0,
            requestCount: 0,
            address: "",
            waitTime: 0,
            currentRequest: [],
            tops: []
        }
        this.getTokenInfo();
        this.requestTop();
        //set a  function to listen event about the requestTokens
        faucetEvent.then((res) => {
            this.getTokenInfo();
            if (this.state.currentRequest.indexOf(res) == -1
                && res.to != this.state.localAddress) {
                let currentRequest = this.state.currentRequest
                currentRequest.push(res)
                this.setState({
                    currentRequest: currentRequest
                })
                this.coutdown(res)
            }
        });
    }

    getTokenInfo = () => {
        $.ajax(api.ip + "/getTokenInfo", {
            method: "GET",
            data: {
                tokenId: address.token
            },
            success: (data) => {
                let token = data[0];
                this.setState({
                    tokenId: token.tokenId,
                    tokenDecimal: token.tokenDecimal,
                    totalSupply: token.totalSupply.toString(10) / (10 ** token.tokenDecimal),
                    waitTime: token.waitTime.toString(10),
                    surplusTokenAmount: parseInt(token.surplusTokenAmount / (10 ** token.tokenDecimal)),
                    tokenAmount: token.tokenAmount.toString(10) / (10 ** token.tokenDecimal),
                })
            },
            error: (err) => {
                console.log(err);
            }
        })
        //show more infomation from the local database on the home page
        $.ajax(api.ip + "/getIndexInfo", {
            method: "GET",
            data: { tokenId: address.token, airDropId: address.airDrop, selfDropId: address.selfDrop },
            success: (data) => {
                let funded = data[0].funded
                this.setState({
                    requestCount: funded,
                })
            },
            error: (err) => {
                console.log(err);
            }
        })
    }

    /**
     * 
     * @param {*} request 
     */
    coutdown = (request) => {
        let counter = 0;
        let counterKey = 'counter' + (this.state.currentRequest.length - 1);
        let avgAmountKey = 'avgAmount' + (this.state.currentRequest.length - 1);
        let timer;

        //show claimed token history about the address
        $.ajax(api.ip + "/avarageClaimedTokenByAddress", {
            method: "get",
            data: {
                address: this.state.address
            },
            success: (data) => {
                let avgToken = data[0].avgToken
                this.setState({
                    [avgAmountKey]: avgToken
                })
            },
            error: (err) => {
                console.log(err);
            }
        })

        timer = setInterval(() => {
            if (counter == this.state.waitTime) {
                //if the couter == this.state.waitTime 
                //we should remove the obj from the currentRequest
                //and delete this counter of obj
                let current = this.state.currentRequest;
                current.splice(current.indexOf(request), 1)
                delete this.state[counterKey]
                delete this.state[avgAmountKey]
                clearInterval(timer)
            }
            counter += 1
            this.setState({
                [counterKey]: counter
            })
        }, 1000);
    }
    checkRequestAgainTime = async () => {
        let address = this.state.address;
        if (address.trim() == "") return false
        //check is the address can request token again 
        let time = await faucetContract.connect(provider.getSigner()).getLastAccessTime(address);
        const now = new Date().getTime()
        const dayForSs = 24 * 60 * 60 * 1000;
        time = (time * 1000) + dayForSs
        const interval = time - now
        if (interval < 24 * 60 * 60 * 1000 && interval > 0) {
            const { hours, minutes, second } = getIntervalFormat(interval)
            message.error(`please request again after ${hours}h${minutes}mm${second}ss`)
            return false
        }
        return true
    }

    /**
     * 
     * @param {*} e 
     * @returns 
     */
    requestToken = (e) => {
        const addressInput = this.state.address;
        if (addressInput.trim() == "") {
            message.error("please input your address")
            return
        }
        //reqest 100 TT Token
        (async () => {
            let isRequestAgain = await this.checkRequestAgainTime();
            if (!isRequestAgain) return

            //trigger the requestToken function
            const data = await faucetContract.connect(provider.getSigner()).requestTokens(wallet.address, addressInput)
            $.ajax(api.ip + "/addClaimed", {
                method: "post",
                data: {
                    txId: data.hash,
                    from: data.from,
                    to: data.to,
                    amount: this.state.tokenAmount * 10 ** this.state.tokenDecimal,
                    date: new Date().getTime(),
                    tokenId: address.token
                },
                success: (data) => {
                    $.ajax(api.ip + "/updateToken", {
                        method: "post",
                        data: {
                            tokenId: address.token,
                            surplusTokenAmount: (this.state.surplusTokenAmount - 100) * 10 ** this.state.tokenDecimal
                        },
                        success: (data) => {
                            let currentRequest = this.state.currentRequest;
                            let clientRequest = { from: wallet.address, to: addressInput }
                            currentRequest.push(clientRequest)
                            this.requestAnalyzeData(data.to);
                            this.coutdown(clientRequest)
                            message.loading({ content: "request loading ", key: "request" }, 5)
                                .then(() => message.success('request success', 3)).then(() => this.setState({ address: "", localAddress: addressInput }))
                        },
                        error: (err) => {
                            console.log(e);
                        }
                    })
                },
                error: (err) => {
                    console.log(err);
                }
            })
        })()
    }

    requestTop = () => {
        $.ajax(api.ip + "/getTop", {
            method: "get",
            data:{
                airDropId:address.airDrop,
                selfDropId:address.selfDrop
            },
            success: (data) => {
                console.log(data)
                this.setState({
                    tops: data
                })
            },
            error: (err) => {
                console.log(err);
            }
        })
    }

    requestAnalyzeData = (address) => {
        $.ajax(api.ip + "/moreThingAddress", {
            method: "get",
            data: { address: address },
            success: (data) => {
                let dataAddress = data[0];
                let lastTime = dataAddress.lastTime == null ? null : new Date(Number(dataAddress.lastTime)).toLocaleString()
                this.setState({
                    claimedTotal: dataAddress.claimedTotal,
                    lastTime: lastTime,
                    aca: dataAddress.aca
                })
            },
            error: (err) => {
                console.log(err);
            }
        })
    }

    /**
     * 
     * @param {*} e 
     */
    handleChange = (e) => {
        this.requestAnalyzeData(e.target.value);
        this.setState({
            [e.target.name]: e.target.value
        })
    }
    render() {
        let blocks = this.props.tokenInfo.blocks;
        let { currentRequest, waitTime, tops } = this.state;
        return <div className="box">
            <p className="title">TT Token Smart Chain Faucet</p>
            <p className="action">
                <input
                    type="text"
                    placeholder="Input your address..."
                    onChange={this.handleChange}
                    value={this.state.address}
                    name="address"></input>
                <button type="button" onClick={this.requestToken}>Give me 100 TT</button>
            </p>
            <div className="wapper">
                <div className="list" style={{ display: this.state.currentRequest.length == 0 ? "none" : "block" }}>
                    {
                        currentRequest.map((item, index) => {
                            return <div className="item" key={index}>
                                <span className="address">{item.to}<span className="extraInfo">Avarage claimed token amount:{this.state['avgAmount' + index]}</span></span>
                                <span className="loading">
                                    <span>{this.state["counter" + index] == waitTime ? "success" : "a few second ago"}</span>
                                    <Progress size="small" style={{ width: "100px", marginLeft: "5px" }} percent={(this.state['counter' + index] / waitTime) * 100} showInfo={false} />
                                </span>

                            </div>
                        })
                    }
                </div>
                <p className="info">
                    <span className="item">
                        <DollarCircleFilled /> &nbsp;
                        <span>{this.state.surplusTokenAmount} TT</span>
                    </span>
                    <span className="item">
                        <DatabaseFilled style={{ marginLeft: '10px' }} />&nbsp;
                        <span>{blocks} blocks</span>
                    </span>
                    <span className="item">
                        <SmileFilled style={{ marginLeft: '10px' }} />&nbsp;
                        <span>{this.state.requestCount} funded</span>
                    </span>
                </p>
            </div>
            {/* show something about this address */}

            <div className="more">
                <p className="claimedTotal">ClaimedTotal: {this.state.claimedTotal == null ? 0 : this.state.claimedTotal / (10 ** this.state.tokenDecimal)}TT</p>
                <p className="">Average Claimed Amount: {this.state.aca == null ? 0 : this.state.aca / (10 ** this.state.tokenDecimal)}TT</p>
                <p>Last Time: {this.state.lastTime}</p>
            </div>
            {/* show something about this faucet */}
            <div className="moreFaucet">
                {
                    tops.map((item, key) => {
                        return <div>
                            <p className="topTitle">Top {key + 1} Address: <a target="_blank" href={"https://testnet.bscscan.com/address/"+item.address}>{item.address}</a> </p>
                            <p>ClaimedTotal: {item.claimedTotal / (10 ** this.state.tokenDecimal)}TT</p>
                            <p>Last Time: {new Date(Number(item.lastTime)).toLocaleString()}</p>
                            <p>Contact: <a>Twiter</a></p>
                        </div>
                    })
                }

            </div>

        </div>
    }
}

export default Faucet