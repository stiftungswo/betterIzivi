import Inferno from 'inferno';
import VNodeFlags from 'inferno-vnode-flags';
import { Link } from 'inferno-router';
import Component from 'inferno-component';
import axios from 'axios';
import ApiService from '../../../utils/api';
import InputField from '../InputFields/InputField';
import InputFieldWithHelpText from '../InputFields/InputFieldWithHelpText';
import InputCheckbox from '../InputFields/InputCheckbox';
import DatePicker from '../InputFields/DatePicker';
import Toast from '../../../utils/toast';

export default class Missions extends Component {
  renderMissions = (self, mission, isAdmin) => {
    let missionKey = mission != null ? mission.id : 'newmission';

    let howerText_Tage =
      'Zeigt dir die Anzahl Tage an welche für den Einsatz voraussichtlich angerechnet werden. Falls während dem Einsatz Betriebsferien liegen werden die entsprechenden Tage abgezogen falls die Dauer zu kurz ist um diese mit Ferientagen kompensieren zu können. Feiertage innerhalb von Betriebsferien gelten auf alle Fälle als Dienstage.';

    var specification_options = [];
    specification_options.push(<option value="" />);
    for (var i = 0; i < self.state.specifications.length; i++) {
      if (self.state.specifications[i].active) {
        specification_options.push(<option value={'' + self.state.specifications[i].fullId}>{self.state.specifications[i].name}</option>);
      }
    }

    var aufgebotErhaltenButton = [];
    if (mission != null && mission.draft == null && isAdmin) {
      aufgebotErhaltenButton.push(
        <button
          class="btn btn-primary"
          type="button"
          onClick={() => {
            this.setReceivedDraft(self, missionKey);
          }}
        >
          Aufgebot erhalten
        </button>
      );
    }

    return (
      <div id={'einsatzModal' + (mission != null ? mission.id : '')} class="modal fade" role="dialog">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <button id="einsatzModalClose" type="button" class="close" data-dismiss="modal">
                &times;
              </button>
              <h4 class="modal-title">Zivildiensteinsatz</h4>
            </div>
            <div class="modal-body">
              <form
                class="form-horizontal"
                action="javascript:;"
                onsubmit={() => {
                  this.saveMission(self, missionKey);
                }}
              >
                <div class="form-group">
                  <label class="control-label col-sm-3" for={missionKey + '_specification'}>
                    Pflichtenheft
                  </label>
                  <div class="col-sm-9">
                    <select
                      value={'' + self.state['result'][missionKey + '_specification']}
                      id={missionKey + '_specification'}
                      name={missionKey + '_specification'}
                      class="form-control"
                      onChange={e => self.handleSelectChange(e)}
                      required
                    >
                      {specification_options}
                    </select>
                  </div>
                </div>
                <div class="form-group">
                  <label class="control-label col-sm-3" for="newmission_mission_type">
                    Einsatzart
                  </label>
                  <div class="col-sm-9">
                    <select
                      value={'' + self.state['result'][missionKey + '_mission_type']}
                      id={missionKey + '_mission_type'}
                      name={missionKey + '_mission_type'}
                      class="form-control"
                      onChange={e => self.handleSelectChange(e)}
                    >
                      <option value="0" />
                      <option value="1">Erster Einsatz</option>
                      <option value="2">Letzter Einsatz</option>
                    </select>
                  </div>
                </div>
                <DatePicker
                  value={self.state['result'][missionKey + '_start']}
                  id={missionKey + '_start'}
                  label="Einsatzbeginn"
                  callback={e => {
                    self.handleDateChange(e, self);
                    this.getMissionDays(self, missionKey);
                  }}
                  callbackOrigin={self}
                />
                <DatePicker
                  value={self.state['result'][missionKey + '_end']}
                  id={missionKey + '_end'}
                  label="Einsatzende"
                  callback={e => {
                    self.handleDateChange(e, self);
                    this.getMissionDays(self, missionKey);
                  }}
                  callbackOrigin={self}
                />
                <InputFieldWithHelpText
                  value={self.state['result'][missionKey + '_days']}
                  id={missionKey + '_days'}
                  label="Tage"
                  popoverText={howerText_Tage}
                  self={self}
                  disabled="true"
                />
                <InputCheckbox
                  value={self.state['result'][missionKey + '_first_time']}
                  id={missionKey + '_first_time'}
                  label="Erster SWO Einsatz"
                  self={self}
                />
                <InputCheckbox
                  value={self.state['result'][missionKey + '_long_mission']}
                  id={missionKey + '_long_mission'}
                  label="Langer Einsatz oder Teil davon"
                  self={self}
                />
                <InputCheckbox
                  value={self.state['result'][missionKey + '_probation_period']}
                  id={missionKey + '_probation_period'}
                  label="Probeeinsatz"
                  self={self}
                />
                <hr />
                <h4>Schnuppertag</h4>
                <p>
                  Tragen Sie nachfolgend ein, ob Sie bei der SWO einen Schnuppertag geleistet haben. Dieser wird dem Einsatz allenfalls
                  angerechnet.
                </p>
                <DatePicker
                  value={self.state['result'][missionKey + '_probation_day']}
                  id={missionKey + '_probation_day'}
                  callback={self.handleDateChange}
                  label="Datum"
                  callbackOrigin={self}
                />
                <div class="form-group">
                  <label class="control-label col-sm-3" for={missionKey + '_probation_day_comment'}>
                    Bemerkungen zum Schnuppertag
                  </label>
                  <div class="col-sm-9">
                    <textarea
                      rows="4"
                      id={missionKey + '_probation_day_comment'}
                      name={missionKey + '_probation_day_comment'}
                      class="form-control"
                      onChange={e => self.handleTextareaChange(e)}
                      value={self.state.result[missionKey + '_probation_day_comment']}
                    />
                  </div>
                </div>
                <hr />
                <h4>Status</h4>
                {mission == null || mission.draft == null ? 'Provisorisch' : 'Aufgeboten, Aufgebot erhalten am ' + mission.draft}
                <hr />
                {mission == null || mission.draft == null ? (
                  <button class="btn btn-primary" type="submit">
                    Daten speichern
                  </button>
                ) : null}
                &nbsp;
                {aufgebotErhaltenButton}
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  };

  setReceivedDraft(self, missionKey) {
    self.setState({ loading: true, error: null });
    axios
      .post(ApiService.BASE_URL + 'mission/' + missionKey + '/receivedDraft', null, {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('jwtToken') },
      })
      .then(response => {
        self.getUser();
        self.getReportSheets();
      })
      .catch(error => {
        self.setState({ error: error });
      });
  }

  getMissions(self) {
    var missions = [];
    if (self.state.result.missions != null) {
      var m = self.state.result.missions;
      for (var i = 0; i < m.length; i++) {
        var name = m[i].specification;
        for (var s = 0; s < self.state.specifications.length; s++) {
          if (m[i].specification == self.state.specifications[s].id) {
            name = name + ' ' + self.state.specifications[s].name;
            break;
          }
        }

        let curMission = m[i];
        var deleteButton = [];
        var addButton = [];

        if (ApiService.isAdmin()) {
          deleteButton.push(
            <button
              class="btn btn-xs btn-danger"
              onClick={() => {
                if (confirm('Möchten Sie diesen Einsatz wirklich löschen?')) {
                  self.missionTag.deleteMission(self, curMission);
                }
              }}
            >
              <span class="glyphicon glyphicon-trash" aria-hidden="true" /> Löschen
            </button>
          );
          addButton.push(
            <button
              data-toggle="popover"
              data-content="Neues Meldeblatt hinzufügen"
              class="btn btn-xs btn-success"
              onClick={() => {
                self.addReportSheet(curMission.id);
              }}
              title=""
            >
              <span class="glyphicon glyphicon-plus" aria-hidden="true" /> Meldeblatt
            </button>
          );
        }

        missions.push(
          <div class="row">
            <div class="col-xs-2">{name}</div>
            <div class="col-xs-2">{moment(m[i].start, 'YYYY-MM-DD').format('DD.MM.YYYY')}</div>
            <div class="col-xs-3">{moment(m[i].end, 'YYYY-MM-DD').format('DD.MM.YYYY')}</div>
            <div class="col-xs-1">
              <a
                class="btn btn-xs"
                href={ApiService.BASE_URL + 'mission/' + curMission.id + '/draft?jwttoken=' + encodeURI(localStorage.getItem('jwtToken'))}
                target="_blank"
              >
                <span class="glyphicon glyphicon-print" aria-hidden="true" /> Drucken
              </a>
            </div>
            <div class="col-xs-1">
              <button class="btn btn-xs btn-warning" data-toggle="modal" data-target={'#einsatzModal' + m[i].id}>
                <span class="glyphicon glyphicon-edit" aria-hidden="true" /> Bearbeiten
              </button>
            </div>
            <div class="col-xs-1">{deleteButton}</div>
            <div class="col-xs-1">{addButton}</div>
          </div>
        );
        missions.push(this.renderMissions(self, m[i], ApiService.isAdmin()));
      }
    }

    return missions;
  }

  saveMission(self, missionKey) {
    var newMission = {
      user: self.state.result.id,
      specification: self.state.result[missionKey + '_specification'],
      mission_type: self.state.result[missionKey + '_mission_type'],
      start: self.state.result[missionKey + '_start'],
      end: self.state.result[missionKey + '_end'],
      first_time: self.state.result[missionKey + '_first_time'],
      long_mission: self.state.result[missionKey + '_long_mission'],
      probation_period: self.state.result[missionKey + '_probation_period'],
      probation_day: self.state.result[missionKey + '_probation_day'],
      probation_day_comment: self.state.result[missionKey + '_probation_day_comment'],
    };

    self.setState({ loading: true, error: null });
    if (missionKey == 'newmission') {
      axios
        .put(ApiService.BASE_URL + 'mission/', newMission, { headers: { Authorization: 'Bearer ' + localStorage.getItem('jwtToken') } })
        .then(response => {
          Toast.showSuccess('Speichern erfolgreich', 'Neuer Einsatz konnte gespeichert werden');
          $('[data-dismiss=modal]').trigger({ type: 'click' });
          self.getUser();
        })
        .catch(error => {
          Toast.showError('Speichern fehlgeschlagen', 'Neuer Einsatz konnte nicht gespeichert werden', error, self.context);
        });
    } else {
      axios
        .post(ApiService.BASE_URL + 'mission/' + missionKey, newMission, {
          headers: { Authorization: 'Bearer ' + localStorage.getItem('jwtToken') },
        })
        .then(response => {
          Toast.showSuccess('Speichern erfolgreich', 'Einsatz konnte gespeichert werden');
          $('[data-dismiss=modal]').trigger({ type: 'click' });
          self.getUser();
        })
        .catch(error => {
          Toast.showError('Speichern fehlgeschlagen', 'Einsatz konnte nicht gespeichert werden', error, self.context);
        });
    }
  }

  deleteMission(self, mission) {
    self.setState({ loading: true, error: null });
    axios
      .delete(ApiService.BASE_URL + 'mission/' + mission.id, { headers: { Authorization: 'Bearer ' + localStorage.getItem('jwtToken') } })
      .then(response => {
        Toast.showSuccess('Löschen erfolgreich', 'Einsatz konnte gelöscht werden');
        self.getUser();
      })
      .catch(error => {
        Toast.showError('Löschen fehlgeschlagen', 'Einsatz konnte nicht gelöscht werden', error, self.context);
      });
  }

  getMissionDays(self, missionKey) {
    self.state.result[missionKey + '_days'] = '';
    self.setState(self.state);

    axios
      .get(
        ApiService.BASE_URL +
          'diensttage?start=' +
          self.state.result[missionKey + '_start'] +
          '&end=' +
          self.state.result[missionKey + '_end'],
        { headers: { Authorization: 'Bearer ' + localStorage.getItem('jwtToken') } }
      )
      .then(response => {
        self.state.result[missionKey + '_days'] = response.data;
        self.setState(self.state);
      });
  }
}