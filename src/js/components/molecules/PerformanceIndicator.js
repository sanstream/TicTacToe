import React from 'react';

export default class PerformanceIndicator extends React.Component {
  constructor(props) {
    super(props);

    this.ticker = false;
    this.initialRating = 5;
    this.initialTime = 500;
    this.colour = {
      'player-1': "#f47c68",
      'player-2': "#4adc69",
    };

    this.state = {
      associatedTo: props.associatedTo,
      remainingTime: this.initialTime, // in seconds
      rating: this.initialRating, // starting rate.
      playerIsInTurn: (props.gameEngine.playerInTurn === props.associatedTo),
      hadATurnPenalty: false,
      gameEngine: props.gameEngine,
    };

    this.bubbles = Array.from({length: this.initialRating}, (v, i) => i+1);

    this.state.gameEngine.addListener('game started', this.reset.bind(this));
    this.state.gameEngine.addListener('new turn started', this.timerCheck.bind(this));
  }

  reset () {
    this.setState({
      remainingTime: this.initialTime, // in seconds
      rating: this.initialRating, // starting rate.
      playerIsInTurn: (this.state.gameEngine.playerInTurn === this.state.associatedTo)
    });


  }

  timerCheck () {
    this.setState({
      playerIsInTurn: (this.state.gameEngine.playerInTurn === this.state.associatedTo)
    });

    if (this.state.playerIsInTurn) {
      this.start();
    } else {
      this.pause();
    }
  }

  updateRating () {
    this.setState({
      rating : this.initialRating * (this.state.remainingTime / this.initialTime)
    });
  }

  updateTime (time, hadATurnPenalty) {
    this.setState({
      remainingTime: ((this.state.remainingTime < time) ? 0 : this.state.remainingTime - time),
      hadATurnPenalty: hadATurnPenalty,
    });


    if(this.state.remainingTime <= 0) {
      this.pause();
    } else {
      this.updateRating();
    }
  }
  start () {
    const self = this;
    this.ticker = setInterval(() => (self.updateTime(1, false)), 1000);
  }

  pause () {
    if (this.ticker) {
      clearInterval(this.ticker);
      this.ticker = false;
      this.updateTime(60,true);
      this.state.associatedTo.points = this.state.remainingTime;
    }
  }

  stop () {
    if (this.ticker) {
      clearInterval(this.ticker);
      this.ticker = false;
      this.state.associatedTo.points = this.state.remainingTime;
    }
  }

  componentWillReceiveProps (nextProps) {

    this.setState({
      playerInTurn: nextProps.playerInTurn,
      playerIsInTurn: (nextProps.gameEngine.playerInTurn === nextProps.associatedTo),
    });


    if (nextProps.timeStopped) {
      this.stop();
    }
  }

  componentDidMount () {
    if (this.state.playerIsInTurn) {
      this.start();
    }
  }

  render () {
    const props = this.props;
    const state = this.state;
    const self = this;

    const turnPenalty = (state.hadATurnPenalty)? (<em>-60</em>) :'';
    const inTurn = (state.playerIsInTurn ? 'is-in-turn': '');
    const playerAvatar = (state.associatedTo? (
      <img className="avatar" src={state.associatedTo.avatar} width="100"/>
    ) : '');
    const classNames = `performance-indicator ${props.associatedTo.getId()} ${inTurn}`;
    return (
      <figure className={classNames}>
        <figcaption>
          {playerAvatar}
          {state.associatedTo.name}
        </figcaption>
        <table>
          <tbody>
            <tr>
              <th>Points</th>
              <th>Rating</th>
            </tr>
            <tr>
              <td className="points">
                <span></span>{state.remainingTime}
                {turnPenalty}
              </td>
              <td className="rating">
                <div className="visual">
                  {self.bubbles.map(function (bubble) {
                    const ratingRoundedUp = parseInt(state.rating,10) + 1;
                    const plyClr = self.colour['player-1'];
                    var style;
                    if(bubble < ratingRoundedUp) {

                      style = plyClr;
                    } else if (bubble === ratingRoundedUp) {

                      const perc = (state.rating - parseInt(state.rating, 10)) * 100;
                      style = `linear-gradient(to right, ${plyClr} 0%,${plyClr} ${perc-10}%,#efefef ${perc}%,#efefef 100%)`;
                    } else {
                      style = '#efefef';
                    }
                      return (<span key={bubble} className="bubble" style={{background:style}}></span>)
                  })}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </figure>
    );
  }
}
