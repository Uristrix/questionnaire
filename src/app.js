import React from 'react';
import M from 'materialize-css';

import axios from 'axios';
import Cookies from 'universal-cookie';

import './style.css';
import logo from './logo-bmstu.png'

const URL = "https://bmstuvoting.herokuapp.com/"

class Navbar extends React.Component {
    render() {
        document.addEventListener('DOMContentLoaded', () => {
            let elems = document.querySelectorAll('.sidenav');
            M.Sidenav.init(elems);
        });
        return (
            <div>
                <nav className="nav-wrapper">
                    <a className= 'brand-logo brush' href="https://mf.bmstu.ru/">
                        <img className="image" src={logo} alt=' Опросник МФ МГТУ'/>
                    </a>
                    <a href="#" data-target="mobile-demo" className="sidenav-trigger"><i
                        className="material-icons">menu</i></a>

                    <ul id = 'bar' className='right hide-on-med-and-down'>
                        <li><a href="http://webrobo.mgul.ac.ru:3000/">webrobo</a></li>
                        <li><a href="http://dbrobo.mgul.ac.ru/">dbrobo</a></li>
                        <li><a href="http://dokuwiki.mgul.ac.ru/dokuwiki/doku.php">dokuwiki</a></li>
                        <li><a href="https://rasp.msfu.ru/">Расписание</a></li>
                    </ul>
                </nav>

                <ul className="sidenav" id="mobile-demo">
                    <li><a href="http://webrobo.mgul.ac.ru:3000/">webrobo</a></li>
                    <li><a href="http://dbrobo.mgul.ac.ru/">dbrobo</a></li>
                    <li><a href="http://dokuwiki.mgul.ac.ru/dokuwiki/doku.php">dokuwiki</a></li>
                    <li><a href="https://rasp.msfu.ru/">Расписание</a></li>
                </ul>
            </div>

        )
    }
}

class Post extends React.Component{

    update = event =>
    {
        event.preventDefault();
        axios.put(URL+"api_form/update/" +this.props.endTime, {'selected': this.props.selected})
            .then(res => {this.props.updateMusic(res.data); this.props.updateCondition();})


        const dt = this.props.date;
        // let lifetime = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(),
        //     dt.getHours(), dt.getMinutes(), 0, 0)
        let lifetime = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(),
            this.props.endTime.split(':')[0], this.props.endTime.split(':')[1], 0, 0)

        if(this.props.endTime < dt.toTimeString().slice(0, 5))
            lifetime.setDate(lifetime.getDate() + 1);
        console.log(lifetime)
        console.log(this.props.date)
        const cookies = new Cookies();
        cookies.set('User', 'true|' + this.props.selected, { path: '/', expires: lifetime});
    }
    render()
    {
        if(this.props.condition === false && this.props.selected !== false)
            return <button className="button anim" onClick={this.update}>Отправить ответ</button>
        else if(this.props.selected === false)
            return <button className="button not_anim" >Отправить ответ</button>
        else
            return <button className="button not_anim">
                Твой ответ успешно отправлен!
            </button>
    }
}

class Element extends React.Component{

    render()
    {
        const percent = (this.props.cond !== false)?
            (parseInt(this.props.music_elem.vote) / this.props.all * 100).toFixed(2)
            : '0';

        const style = (this.props.selected === this.props.music_elem.name)? 'elem select':'elem'

        const update = (this.props.cond !== false )? () => {}: () => {this.props.updateSelected(this.props.music_elem.name)}
        return(
            <div className={style} onClick={update}>
                <span className='progress-bar' style={{'width': percent + "%"}}/>
                <div className='content'>
                    <div style={{"TextAlign":"center"}}>{this.props.music_elem.name}</div>
                    <div>{percent + "%"}</div>
                </div>
            </div>
        )
    }
}

class App extends React.Component{

    constructor(props) {
        super(props);
        this.state = { date: new Date()};
        this.init()
        this.checkCookie()
        this.set_time()
    }

    init = () => { setInterval(() => { this.setState({date: new Date()})}, 60000) }

    updateSelected = (value) => { this.setState({selected: value}) }

    updateCondition = () => { this.setState({condition : true}) }

    update_music = (data) =>  this.setState(data)

    set_time = () => { axios.get(URL +'api_form/time' ).then( res => {
        this.setState(res.data)
        this.set_music();
    }) }


    set_music = () => {
        let endTime = undefined;
        const time = this.state.time;
        const tnow = this.state.date.toTimeString().slice(0, 5)
        time.forEach((t, i) =>
        {
            if(endTime === undefined && tnow < time[i])
                endTime = time[i];
            else if(endTime === undefined && tnow > time[i] && i === time.length - 1)
                endTime = time[0];
        })
        axios.get(URL+'api_form/music_list/' + endTime).then( res => { this.setState(res.data); this.setState({endTime: endTime});} )
    }

    del = () =>
    {
        const index = this.state.time.indexOf(this.state.endTime)
        const newTime = index === this.state.time.length -1? this.state.time[0]: this.state.time[index + 1]
        axios.delete(URL+'api_form/erase/' + newTime).then(() => this.set_music())
    }


    checkCookie = () =>
    {
        new Promise((resolve) =>
        {
            const cookies = new Cookies();
            const ck = cookies.get('User')
            resolve(ck)
        }).then( (ck) =>
            {
                if(ck !== undefined)
                {
                    const param = ck.split('|');
                    this.setState({condition: Boolean(param[0]), selected: param[1]})
                }
                else this.setState({selected: false, condition: false})
            }
        )
    }
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    render() {
        if(this.state.endTime !== undefined)
            if(this.state.date.getHours() === this.state.endTime.split(':')[0] &&
                this.state.date.getMinutes() === this.state.endTime.split(':')[1])
            {
                this.del()
                this.checkCookie();
            }

        if(this.state.music !== undefined)
        {
            let voices = 0;

            const music = this.state.music;
            for(let i = 0; i < music.length; i++) voices += parseInt(music[i].vote)
            const questionnaire = music.map( (elem) => {
                return <Element all = {voices} cond={this.state.condition} music_elem={elem} selected={this.state.selected} updateSelected={this.updateSelected}/>
            });

            return<div>
                    <Navbar/>
                    <h3 style={{'textAlign': 'center'}}>What music will be played in {this.state.endTime}:00</h3>
                    <div>{questionnaire}</div>
                    <Post date = {this.state.date}
                          time = {this.state.time}
                          endTime = {this.state.endTime}
                          selected = {this.state.selected}
                          condition = {this.state.condition}
                          updateCondition = {this.updateCondition}
                          updateMusic = {this.update_music}
                    />
                </div>
        }
        else
        {
            return <div>
                <Navbar/>
                <h3 className='loading'>Loading...</h3>
            </div>
        }

    }
}

export default (App)