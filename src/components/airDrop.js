import { Component } from "react";
import {
    DollarCircleFilled,
    DatabaseFilled,
    SmileFilled
} from '@ant-design/icons'
import { message, Progress } from "antd";
import { wallet, airDropContract, provider } from "../config";
import api from '../api'
import address from '../address'
import $ from "jquery";

let faucetEvent = new Promise((resolve, reject) => {
    airDropContract.connect(provider.getSigner()).on("AirDrop", (from, to, event) => {
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

class AirDrop extends Component {
    constructor() {
        super()
        this.state = {
            localAddress: "",
            token: null,
            totalSupply: 0,
            surplusTokenAmount: 0,
            tokenAmount: 0,
            tokenDecimal: 0,
            blocks: 0,
            requestCount: 0,
            addresses: "",
            waitTime: 0,
            currentRequest: []
        }

        this.getTokenInfo();
        this.getAirDropInfo();
        faucetEvent.then((res) => {
            this.getTokenInfo();
            this.getAirDropInfo();
            console.log(res)
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

    /**
         * 
         * @param {*} request 
         */
    coutdown = (request) => {
        let counter = 0;
        let counterKey = 'counter' + (this.state.currentRequest.length - 1);
        let timer;

        timer = setInterval(() => {
            if (counter == this.state.waitTime) {
                //if the couter == this.state.waitTime 
                //we should remove the obj from the currentRequest
                //and delete this counter of obj
                let current = this.state.currentRequest;
                current.splice(current.indexOf(request), 1)
                delete this.state[counterKey]
                clearInterval(timer)
            }
            counter += 1
            this.setState({
                [counterKey]: counter
            })
        }, 1000);
    }

    getAirDropInfo = () => {
        $.ajax(api.ip + "/getAirDropInfo", {
            method: "get",
            data: {
                tokenId: address.token,
                airDropAddress: address.airDrop
            },
            success: (data) => {
                console.log(data)
                let decimal = data[0].tokenDecimal;
                this.setState({
                    airDropBalance: data[0].totalAmount / (10 ** decimal),
                    tokenDecimal: data[0].tokenDecimal,
                    count:data[0].count
                })
            },
            error: (err) => {
                console.log(err);
            }
        })
    }

    getTokenInfo = () => {
        $.ajax(api.ip + "/getTokenInfo", {
            method: "GET",
            data: {
                tokenId: address.token
            },
            success: (data) => {
                let token = data[0];
                console.log(token)
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
    }
    /**
     * 
     * @param {*} e 
     */
    handleChange = (e) => {
        this.setState({
            [e.target.name]: e.target.value
        })
    }
    handleAirDrop = () => {
        let addrs = this.state.addresses.split(",");
        (async () => {
            const data = await airDropContract.connect(provider.getSigner()).airDrop(addrs);
            $.ajax(api.ip + "/addClaimed", {
                method: "post",
                data: {
                    txId: data.hash,
                    from: address.airDrop,
                    to: addrs.toString(),
                    amount: (this.state.tokenAmount * 10 ** this.state.tokenDecimal) * addrs.length,
                    date: new Date().getTime(),
                    tokenId: address.token
                },
                success: (data) => {
                    this.getAirDropInfo();
                },
                error: (err) => {
                    console.log(err);
                }
            })
        })()
    }
    render() {

        let blocks = this.props.tokenInfo.blocks;
        let { currentRequest, waitTime } = this.state;
        return <div className="box" style={{ marginTop: "150px" }}>
            <p className="title">Token AirDrop</p>

            <p className="action">
                <input
                    type="text"
                    placeholder="[address1,address2,...]"
                    onChange={this.handleChange}
                    // style={{marginTop:"20px"}}
                    value={this.state.addresses}
                    name="addresses">
                </input>
                <button type="button" onClick={this.handleAirDrop}>AirDrop</button>
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
                        <span>{this.state.airDropBalance} TT</span>
                    </span>
                    <span className="item">
                        <DatabaseFilled style={{ marginLeft: '10px' }} />&nbsp;
                        <span>{blocks} blocks</span>
                    </span>
                    <span className="item">
                        <SmileFilled style={{ marginLeft: '10px' }} />&nbsp;
                        <span>{this.state.count} funded</span>
                    </span>
                </p>
            </div>
        </div>
    }
}

export default AirDrop