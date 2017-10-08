import React, { Component } from 'react';
import Recharts from 'recharts'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

import axios from 'axios';
import Promise from 'bluebird';

var baseURL = "http://localhost:3001/getdotastatistics?";

export default class App extends Component {
  constructor(props) {
    super(props);

    this.fields = ["gpm", "hero_damage", "xpm", "last_hits", "kda", "tower_damage", "denies"]
    this.periods = ["all_time", "day", "week", "month"];

    this.currentField = 0;
    this.currentPeriod = 0;

    this.state = {statistics:null, formattedData: [], field: this.fields[this.currentField], period: this.periods[this.currentPeriod]};
  }

  getDotaStatisticsForSteamId(steamId) {
    let requestURL = "http://localhost:3001/getdotastatistics?steamID=76561198404101751"
  
    let that = this;
    return axios.get(requestURL)
    .then(function (response) {
      that.updateDataInState(response.data);
    })
    .catch(function (error) {
      console.log("getDotaStatisticsForSteamId failed: " + error);
      return {};field
    });
  }

  updateDataInState(newData) {
    let copy = Object.assign({}, this.state, {statistics: newData});
    this.setState(copy);
  }

  componentDidMount() {
    this.getDotaStatisticsForSteamId(76561198404101751);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.statistics != this.state.statistics) {
      let copy = Object.assign({}, this.state, {formattedData: this.formatData(this.state.field, this.state.period)});
      this.setState(copy);
    }
    if (prevState.field != this.state.field) {
      let copy = Object.assign({}, this.state, {formattedData: this.formatData(this.state.field, this.state.period)});
      this.setState(copy);
    }
    if (prevState.period != this.state.period) {
      let copy = Object.assign({}, this.state, {formattedData: this.formatData(this.state.field, this.state.period)});
      this.setState(copy);
    }
  }

  getMondayOfCurrentWeek(d)
  {
      var day = d.getDay();
      return new Date(d.getFullYear(), d.getMonth(), d.getDate() + (day == 0?-6:1)-day );
  }

  getSundayOfCurrentWeek(d)
  {
      var day = d.getDay();
      return new Date(d.getFullYear(), d.getMonth(), d.getDate() + (day == 0?0:7)-day );
  }

  getFirstDayOfCurrentMonth(d){
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }
  
  getLastDayOfCurrentMonth(d){
    return new Date(d.getFullYear(), d.getMonth()+1, 0);
  }

  formatData(field, period) {
    let data = [];
    
    let matches = this.state.statistics.matches.slice(0);

    matches.sort(function (a, b) {
      return a.start_time - b.start_time;
    });

    //filter
    if (period == "month") {
        var date = new Date();
        var firstDay = Math.floor(this.getFirstDayOfCurrentMonth(date).getTime() / 1000);
        var lastDay = Math.floor(this.getFirstDayOfCurrentMonth(date).getTime() / 1000);
        
        matches = matches.filter(function(match) {
          return match.start_time >= firstDay;
        });
      }
      else if (period == "week") {
        var curr = new Date;
        var firstday = Math.floor(this.getMondayOfCurrentWeek(curr).getTime() / 1000);
        var lastday = Math.floor(this.getSundayOfCurrentWeek(curr).getTime() / 1000);

        matches = matches.filter(function(match) {
          return match.start_time >= firstday && match.start_time < lastday;
        });
      }
      else if (period == "day") {
        var curr = new Date;

        matches = matches.filter(function(match) {
          let dateTime = new Date(match.start_time);
          return dateTime.getDate() == curr.getDate();
        });
      }
      else {
        
      }

    
    /*matches = matches.map(function(match) {
      let matchFormatted = match;

      let dateTime = new Date(matchFormatted.start_time);

      let year = dateTime.getFullYear();
      let month = dateTime.getMonth();
      let date = dateTime.getDate();
      let hours = dateTime.getHours();
      let minutes = dateTime.getMinutes();

      matchFormatted.start_time = year + "/" + month + "/" + date + " " + hours + ":" + minutes;
      return matchFormatted;
    });*/

    console.log("Sorted");

    var dateToHumanReadable = function(timestamp) {
      let dateTime = new Date(timestamp * 1000);
      let year = dateTime.getFullYear();
      let month = dateTime.getMonth();
      let date = dateTime.getDate();
      let hours = dateTime.getHours();
      let minutes = dateTime.getMinutes();
      
      //return (date + "/" + month + "/" + year + " " + hours + ":" + minutes);
      return dateTime.toLocaleDateString() + " " + dateTime.toLocaleTimeString();
    }


    for (let i = 0; i < matches.length; ++i) {
      let dataEntry = {date: dateToHumanReadable(matches[i].start_time), value: matches[i][field]};
      data.push(dataEntry);
    }

    console.dir(this.state)

    return data;
  }

  renderChart() {
    const formattedData = this.state.formattedData;

    const Chart = 
    <ResponsiveContainer width="80%" height={400}>
    <LineChart width={2000} height={400} data={formattedData}margin={{top: 5, right: 30, left: 20, bottom: 5}}>
      <XAxis dataKey="date" stroke='red'/>
      <YAxis stroke='green' />
      <CartesianGrid strokeDasharray="4 4"/>
      <Tooltip/>
      <Legend/>
      <Line type='linear' dataKey='value' stroke='brown' strokeWidth={2} />
    </LineChart>
    </ResponsiveContainer>;

    return Chart;
  }

  switchField() {
    this.currentField = (this.currentField + 1) % this.fields.length;

    let copy = Object.assign({}, this.state, {field: this.fields[this.currentField]});
    this.setState(copy);
  }

  switchPeriod() {
    this.currentPeriod = (this.currentPeriod + 1) % this.periods.length;
    console.log("Switch periods: " + this.currentPeriod);
    console.log("this.periods[this.currentPeriod]: " + this.periods[this.currentPeriod]);
    
    let copy = Object.assign({}, this.state, {period: this.periods[this.currentPeriod]});
    this.setState(copy);
  }

  renderFieldSwitchButtons() {
    return <div><button onClick={() => this.switchField()}>{this.state.field}</button></div>;
  }

  renderButtonPeriod() {
    return <div><button onClick={() => this.switchPeriod()}>{this.state.period}</button></div>;
  }
  
  render() {

const Chart = (this.state.formattedData && this.state.formattedData.length > 0) ? this.renderChart() : <p>No Chart Yet</p>;
const ButtonField = this.renderFieldSwitchButtons();
const ButtonPeriod = this.renderButtonPeriod();

    return (
      <div>
      {Chart}
      {ButtonField}
      {ButtonPeriod}
      </div>
    );
  }
}
