import React, { Component } from 'react';
const fs = window.require('fs');
const electron = window.require('electron');
const remote = electron.remote;
const ipc = electron.ipcRenderer;
const mainProcess = remote.require('./main.js');
const injectTapEventPlugin = require('react-tap-event-plugin');
import AutoComplete from 'material-ui/AutoComplete';
import TextField from 'material-ui/TextField';
import FlatButton from 'material-ui/FlatButton';
injectTapEventPlugin();

export default class SaveScreenshot extends Component {
  constructor(props) {
    super(props);
    this.state = {
      imgData: '',
      directories: [],
      folder: '',
      newName: '',
      errorMessage: false,
    }

    this.saveFile = this.saveFile.bind(this);
    this.fileCheck = this.fileCheck.bind(this);
    this.tryAgain = this.tryAgain.bind(this);
  }

  componentDidMount() {
    ipc.send('mounted', 'mounted')

    ipc.on('currentImg', (event, imgData) => {
      this.setState({ imgData })
      this.setState({ directories: imgData.directories })
    })
  }

  fileCheck(e) {
    const { folder, imgData } = this.state;
    const { file } = imgData;
    const newName = e.target.value;

    mainProcess.fileCheck({ folder, newName, file })

    ipc.on('duplicate', (event, response) => {
      if (response === true) {
        this.setState({ errorMessage: true })
      }
      else if (response === false) {
        this.setState({ errorMessage: false })
      }
    })
  }

  saveFile() {
    const { folder, newName, imgData } = this.state;
    const { file } = imgData;

    const fileToSave = { folder, newName, file }

    mainProcess.saveFile(fileToSave);
    this.setState({ folder: '', newName: '', imgData: '' }, () => {
      this.props.toggleView()
    })
  }

  tryAgain() {
    mainProcess.deleteFile(this.state.imgData)
  }

  render() {
    const { imgData, folder, newName, directories, errorMessage, submitted } = this.state

    const dispErrorMessage = () => {
      if (errorMessage) {
        return (
            <p>This file already exists in this folder.  Please enter a new name</p>
        )
      }
    }

    return (
      <div>
        <div className='save-inputs'>

          <label>
            Desktop/snip-it-images/

            <AutoComplete floatingLabelText="Change Screenshot Location"
                          className='input'
                          hintText='Choose Folder'
                          onNewRequest={(folder) => this.setState({ folder })}
                          filter={AutoComplete.fuzzyFilter}
                          dataSource={directories}
                          onUpdateInput={(e) => this.setState({ folder: e }) }
                          openOnFocus />
          </label>

          <TextField id='file-input'
                     className='input'
                     floatingLabelText="Change Screenshot Name"
                     hintText={imgData.file}
                     value={newName}
                     onChange={(e) => this.setState({ newName: e.target.value })}
                     onKeyUp={this.fileCheck} />

          <div className='save-screen-btns'>
            <FlatButton className='btn'
                        onTouchTap={this.saveFile}
                        disabled={errorMessage || !newName && !folder}
                        label='Save' />

            <FlatButton className='btn try-again-btn'
                        label='Try Again'
                        onTouchTap={this.tryAgain} />
          </div>

        </div>

        <div className='error-msg'>
          {dispErrorMessage()}
        </div>

        <div className='canvas-container'>
          <img id='screenshot'
               src={imgData.filePath}
               width={`${imgData.width/2}px`}
               height={`${imgData.height/2}px`}/>
        </div>
      </div>
    )
  }
}
