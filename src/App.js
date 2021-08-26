
import { Component } from 'react';
import './App.less';
import Faucet from "./components/faucet"
import AirDrop from "./components/airDrop"
import SelfDrop from "./components/selfDrop"
import { wallet, faucetContract, provider } from "./config";
import $ from "jquery";
import address from './address'
import api from './api'

class App extends Component {
  constructor() {
    super();
    this.state = {
      layer: 1,
      totalLayer: 3,
      left: 0,
      token: null,
      totalSupply: 0,
      surplusTokenAmount: 0,
      tokenAmount: 0,
      tokenDecimal:0,
      blocks: 0,
      requestCount: 0,
      address: "",
      waitTime: 0,
      currentRequest: []
    }
    //set a 1s interval to update these initialization value
    setInterval(() => {
      this.init();
    }, (1000));
  }
  init = () => {
    //request extra info from the bsc chain
    (async () => {
      //blocks number
      let blocks = await faucetContract.connect(provider.getSigner()).getBlocks();
      blocks = blocks.toString(10)
      this.setState({
        blocks: blocks,
      })
    })()
  }
  handleNext = () => {
    let layer = this.state.layer;
    let totalLayer = this.state.totalLayer;
    let moveWidth = document.body.clientWidth;
    if (layer == totalLayer) return
    this.setState({
      layer: ++layer,
      left: this.state.left - moveWidth
    });
  }
  handlePrev = () => {
    let layer = this.state.layer;
    if (layer == 0) return;
    let moveWidth = document.body.clientWidth;
    this.setState({
      layer: --layer,
      left: this.state.left + moveWidth
    });
  }
  render() {
    return (
      <div className="App">
        <ul style={{ left: this.state.left + "px" }}>
          <Faucet ref="box" tokenInfo={{  blocks: this.state.blocks}} />
          <AirDrop tokenInfo={{blocks: this.state.blocks}} />
          <SelfDrop tokenInfo={{blocks: this.state.blocks}} />
        </ul>

        <img className="prev" style={{ display: this.state.layer <= 1 ? "none" : "inline-block" }} onClick={this.handlePrev} src="/left.png" alt="SelfDrop" />
        <img className="next" onClick={this.handleNext} style={{ display: this.state.layer >= this.state.totalLayer ? "none" : "inline-block" }} src="/right.png" alt="AirDrop" />
      </div>
    );
  }
}

export default App;
