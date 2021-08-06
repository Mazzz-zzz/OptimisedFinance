import './Victorygraph.css';
import React, {useState} from 'react';
import { VictoryLine, VictoryChart, VictoryLegend, VictoryScatter, VictoryAxis, VictoryTheme } from 'victory';
import {ReactComponent as LongDiagram} from './Optimised-Long.svg';
// Graph init
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  useQuery,
  gql
} from "@apollo/client";

const client = new ApolloClient({
  uri: 'https://graph.mirror.finance/graphql',
  cache: new InMemoryCache()
});


const ASSET_DATA = gql`
query GetData {
  assets {
    symbol, 
    token, 
    statistic {
      apr {
        long, short
      }
    }
    positions {
      pool, uusdPool
    }
  }
}
`;


function TerraFarm() {
  const {loading, error, data} = useQuery(ASSET_DATA);

  if (loading) return <option>Loading...</option>;
  if (error) return  <option>Error Loading Assets </option>
  return data.assets.map((element, index) =>
  <option id={element.token} key={index} name="Asset" >{element.symbol}-UST</option>
  )
};

class Victorygraph extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      Principal: 1000, 
      Yeild: '0.00003', 
      Sim_Blocks: 100, 
      C_Blocks: 20,
      data: [],
      fees: [],
      totalFees: 0,
      totalAmount: 1000,
      SwapData: {},
      TotalData: [],
      FeeData: [],
      YeildData: [],
      GraphData: {CompoundFees: [], Amount: []},
      TerraData: {Asset: 'mTSLA', Position: "Short", APR: 0.23, Slippage: "Not Yet implemented", Price: 0, Tax: 0.1, FrFee: 0.003, Pool: 21365140798, UusdPool: 3101243294523},
    };


    this.makeData = this.makeData.bind(this);
    this.ChangeOptions = this.ChangeOptions.bind(this);
    this.GetTerraData = this.GetTerraData.bind(this);

    this.DataManager = this.DataManager.bind(this);
    this.SellMIR = this.SellMIR.bind(this);
    this.BuyAsset = this.BuyAsset.bind(this);
    this.CreateLP = this.CreateLP.bind(this);
  };
  DataManager() {
    let AprPerDay = this.state.TerraData.APR/365;
    let InitAmount = this.state.Principal;
    let i = 0;
    let Amount = [{x: i, y: InitAmount}];
    let CompoundFees = [{x: i, y: 0}];
    for (i; (i+this.state.C_Blocks) <= this.state.Sim_Blocks; i=i+this.state.C_Blocks) {
      let GeneratedYeild = AprPerDay*this.state.C_Blocks*Amount[i].y;
      let [YeildValue, Fees] = this.SellMIR(GeneratedYeild);
      let [AmountBought, Fees2] = this.BuyAsset(YeildValue/2);
      let [LPAmount, Fees3] = this.CreateLP(AmountBought*2);
      let IterationFees = Fees + Fees2 + Fees3;

      CompoundFees[i+this.state.C_Blocks] = {x: i+this.state.C_Blocks, y: CompoundFees[i].y + IterationFees};
      Amount[i+this.state.C_Blocks] = {x: i+this.state.C_Blocks, y: Amount[i].y + LPAmount - IterationFees};
    }

    let remainder = parseInt(this.state.Sim_Blocks % this.state.C_Blocks);
    console.log(remainder);
    if (remainder > 0) {
      let GeneratedYeild = AprPerDay*remainder*Amount[i].y;
      let [YeildValue, Fees] = this.SellMIR(GeneratedYeild);
      let [AmountBought, Fees2] = this.BuyAsset(YeildValue/2);
      let [LPAmount, Fees3] = this.CreateLP(AmountBought*2);
      let IterationFees = Fees + Fees2 + Fees3;

      CompoundFees[this.state.Sim_Blocks] = {x: i+remainder, y: CompoundFees[i].y + IterationFees};
      Amount[this.state.Sim_Blocks] = {x: i+remainder, y: Amount[i].y + LPAmount - IterationFees};
    }
    //now put it in state
    let GraphData = {...this.state.GraphData};
    GraphData["CompoundFees"] = CompoundFees;
    GraphData["Amount"] = Amount;
    console.log(Amount);
    this.setState({GraphData});
    let FinalAmount = Amount[Amount.length - 1];
    let FinalFees = CompoundFees.slice(-1);
    console.log(FinalFees);
    this.setState({totalAmount: FinalAmount.y, totalFees: FinalFees[0].y});
  };
  SellMIR(GeneratedYeild) {
    //Assume slippage is zero for now
    //TxFee in $UST
    let TxFee = 0.1;
    //Commission calculated in $UST
    let Commission = 0.003*GeneratedYeild;
    //Spread Calculated in $UST
    //Not exactly right as we need MIR data not asset data!!!
    let X = this.state.TerraData.UusdPool;
    let Y = this.state.TerraData.Pool;
    let Ratio = Y/X
    let A = GeneratedYeild*Ratio;
    let SpreadPenalty = ((Y*A)/(X+A) - (Y*A)/X)*GeneratedYeild;
    let Fees = TxFee + Commission + SpreadPenalty;
    return [GeneratedYeild-Fees, Fees];
  };
  BuyAsset(AmountToBuy) {
    let TxFee = Math.min(0.1,0.00625*AmountToBuy);
    let Commission = 0.003*AmountToBuy;
    let X = this.state.TerraData.UusdPool;
    let Y = this.state.TerraData.Pool;
    let Ratio = Y/X
    let A = AmountToBuy*Ratio;
    let SpreadPenalty = ((Y*A)/(X+A) - (Y*A)/X)*AmountToBuy;
    let Fees = TxFee + Commission + SpreadPenalty;
    //Problem is 1:1 value can never be realised as fees are hard to predict beforehand to allow best amount to buy
    return [AmountToBuy-Fees, Fees]
  };
  CreateLP(Amount) {
    let TxFee = Math.min(0.1,0.00625*Amount);
    return [Amount-TxFee, TxFee]
  };
  makeData(event) {
    this.DataManager();
    //event.preventDefault()
    let data = [];

    let fees = [];
    let totalFees = 0;
    let staticFee = this.state.TerraData.Tax;
    let percentFee = this.state.TerraData.FrFee;
    let assetPrice = this.state.TerraData.Price;

    let staked = parseFloat(this.state.Principal);
    let totalAmount = staked;
    let reward = 0.0;
    let compounding_blocks = parseInt(this.state.C_Blocks);
    let Sim_Blocks = parseInt(this.state.Sim_Blocks);
    let yeild_dollar_block = parseFloat(this.state.Yeild);
   
    let apr_percent =  parseFloat(this.state.TerraData.APR);
    const days_per_year = 365;
    let compound_period = parseInt(this.state.C_Blocks);
    const fr_per_period = ((apr_percent/100)/days_per_year)
    

    //let staked = 1000//parseFloat(this.state.Principal);

    for (let i = 0; i<days_per_year; i=i+compound_period) {
      let yeild_period = staked*compound_period*fr_per_period;
      if (i+compound_period > days_per_year) {
        yeild_period = staked*(days_per_year-i)*fr_per_period
      }
      let fees_period=0;
      if (yeild_period > 376) {
        fees_period = 2*1.429895 + 4*staticFee;
      }
      else {
        fees_period = 4*staticFee + 2*yeild_period*percentFee;

      }
      let total_end_of_period = staked+yeild_period-fees_period;
      data[i] = {y: total_end_of_period, x:i};

      staked = staked + yeild_period - fees_period;
    }
    this.setState({data: data, fees: fees, totalFees: totalFees, totalAmount: staked});
  };

  GetTerraData(name, position) {
  
    client.query({query: ASSET_DATA}).then((result) => {
      let apr = "loading...";
      let slippage = "loading..."
      let pack = {apr, slippage}
      for (let i = 0; i< result.data.assets.length; i++) {
        if (name == result.data.assets[i].symbol) {
          console.log("Matched");
          slippage = "Not Yet implemented";
          if (position == "LONG") {
            apr = result.data.assets[i].statistic.apr.long;
          }
          else {
            apr = result.data.assets[i].statistic.apr.short;
          }
          let TerraData = {...this.state.TerraData};
          TerraData["APR"] = apr;
          TerraData["Slippage"] = slippage;
          this.setState({TerraData});
        }
      }
    }
    )
  };
  ChangeOptions(e) {
    let OptionName = e.target.name;
    let OptionValue = e.target.value;
    if (OptionName == "C_Blocks" || OptionName == "Sim_Blocks" || OptionName =="Principal") {
      let newState = {};
      newState[OptionName] = parseFloat(e.target.value);
      this.setState((newState), () => {
        this.DataManager();
      });
    }
    else {
      // 1. Make a shallow copy of the items
      let TerraData = {...this.state.TerraData};
      // 2. Set new state
      TerraData[OptionName] = OptionValue;
      // 3. Get APR and slippage data
      // 3. Set the state to our new copy
      this.setState(({TerraData}), () => {
        let Asset = this.state.TerraData.Asset 
        Asset = Asset.replace("-UST", "");
        let Postion = this.state.TerraData.Position;
        this.GetTerraData(Asset, Postion);
        this.DataManager();
      });
    }
  }

  render() {
    return(
      <div className="Container">
        <div className="Graph">
          <VictoryChart className="GraphElement" theme={VictoryTheme.material}>
            <VictoryLegend x={90} y={60}
              title="Legend"
              centerTitle
              orientation="horizontal"
              gutter={20}
              style={{ border: { stroke: "black" }, title: {fontSize: 10 } }}
              data={[
                { name: "Total", symbol: {fill: "#c43a31"}, }, { name: "Fees", symbol: {fill: "#c4c4c4"} }
              ]}
            />
            <VictoryLine
                style={{data: {stroke: "#c43a31"}}}
                //samples={400}
                //y={(d) => Math.pow(parseFloat(this.state.value)*(1+0.01),d.x)}
                domain={{x: [0, parseInt(this.state.Sim_Blocks)], y: [-10, 4*parseInt(this.state.Principal)]}}
                data={this.state.GraphData.Amount}
            />
            <VictoryLine
                name="fees"
                style={{data: {stroke: "#c4c4c4",}}}
                //samples={50}
                //y={(d) => Math.pow(parseFloat(this.state.value)*(1+0.01),d.x)}
                domain={{x: [0, parseInt(this.state.Sim_Blocks)], y: [0, 4*parseInt(this.state.Principal)]}}
                data={this.state.GraphData.CompoundFees}
            />
          </VictoryChart>
        </div>
        <form className="Form">
            <label className="FormSection">
              <div className="FormTitle TextDescription">
              Liquidity Pool:
              </div>
              <select className="DropMenu" name="Asset" onChange={this.ChangeOptions}>
                <TerraFarm></TerraFarm>
              </select>
            </label>
            <label className="FormSection">
              <div className="FormTitle TextDescription">
              Farm:
              </div>
              <div className="RadioSelectors">
                <label >LONG</label>
                <input type="radio" name="Position" value="LONG" defaultChecked onClick={this.ChangeOptions}></input>
              </div>
              <div className="RadioSelectors">
                <label >SHORT</label>
                <input type="radio" name="Position" value="SHORT" onClick={this.ChangeOptions}></input>
              </div>
            </label>
            <label>
              <p>APR: {parseFloat(this.state.TerraData.APR*100).toFixed(2)} %</p>
              <p>Slippage: {this.state.TerraData.Slippage}</p>
            </label>
            <label>
              Principal ($UST):
              <input type="text" name="Principal" value={this.state.Principal} onChange={this.ChangeOptions} />
            </label>
            <label>
              simulation Days:
              <input type="number" name="Sim_Blocks" value={this.state.Sim_Blocks} onChange={this.ChangeOptions}></input>
            </label>
            <div>
              <label>
                Compound Every (x) Days:
              </label>
              <input type="number" name="C_Blocks" value={this.state.C_Blocks} onChange={this.ChangeOptions}/>
              <input type="button" value="Calculate Optimal"/>
            </div>
            <div className="ImageSection">
              <div>
                <img className="OptimiseLogo" alt="Not loaded" src="./Asset1.svg"></img>
                
              </div>
            </div>
            <p>total fees: {this.state.totalFees}</p>
            <p>Final Amount: {this.state.totalAmount}</p>
          </form>

      </div>
      );
    }
  }


export default Victorygraph