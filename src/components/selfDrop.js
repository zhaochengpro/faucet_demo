import { Component } from "react";
import {
    DollarCircleFilled,
    DatabaseFilled,
    SmileFilled
} from '@ant-design/icons'
import { message, Progress } from "antd";
import { wallet, selfDropContract, provider } from "../config";
import address from '../address'
import { Contract, ethers, providers } from "ethers";
import api from '../api'
import $ from "jquery";

let faucetEvent = new Promise((resolve, reject) => {
    selfDropContract.connect(provider.getSigner()).on("RewardClaimed", (to, value, event) => {
        event.removeListener()
        resolve({
            to: to,
            value: value.toString(10),
        });
        setTimeout(() => {
            reject(new Error('timeout'));
        }, 60000)
    })
})

class SelfDrop extends Component {
    constructor() {
        super()
        this.state = {
            localAddress: "",
            token: null,
            totalSupply: 0,
            surplusTokenAmount: 0,
            tokenAmount: 0,
            blocks: 0,
            decimal: 0,
            requestCount: 0,
            address: "",
            waitTime: 0,
            currentRequest: []
        }

        this.getSelfDrop();
        this.getTokenInfo();
        faucetEvent.then((res) => {
            console.log(res);
            this.getSelfDrop();
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

    getSelfDrop = () => {
        $.ajax(api.ip + "/getSelfDropInfo", {
            method: "get",
            data: {
                tokenId: address.token,
                selfDropAddress: address.selfDrop
            },
            success: (data) => {
                let decimal = data[0].tokenDecimal;
                this.setState({
                    selfDropBalance: data[0].totalAmount / 10 ** decimal,
                    decimal: decimal,
                    count: data[0].count
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
    /**
     * 
     * @param {*} e 
     * @returns 
     */
    handleSelfDrop = (e) => {
        // //reqest 100 TT Token
        (async () => {
            const data = await selfDropContract.connect(provider.getSigner()).claim();
            $.ajax(api.ip + "/addClaimed", {
                method: "post",
                data: {
                    txId: data.hash,
                    from: address.selfDrop,
                    to: provider.provider.selectedAddress,
                    amount: this.state.tokenAmount * 10 ** this.state.decimal,
                    date: new Date().getTime(),
                    tokenId: address.token
                },
                success: (data) => {
                   this.getSelfDrop()
                },
                error: (err) => {
                    console.log(err);
                }
            })
        })()
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
    render() {
        let blocks = this.props.tokenInfo.blocks;
        let { currentRequest, waitTime } = this.state;
        return <div className="box" style={{ marginTop: "150px" }}>
            <p className="title">Token Self Drop</p>
            <p className="action">
                <button type="button" onClick={this.handleSelfDrop}>SelfDrop</button>
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
                        <span>{this.state.selfDropBalance} TT</span>
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

export default SelfDrop