const request = require('request-promise');
const Handlebars = require('handlebars');
const Codefresh = require('./codefresh');
const path = require('path');
const fs = require('fs');

class Controller {
    constructor() {
        this._sendMessage = this._sendMessage.bind(this);
        this._sendGitter = this._sendGitter.bind(this);
        this._sendStatus = this._sendStatus.bind(this);

        this._webhookUri = process.env.GITTER_WEBHOOK;
        this._status = process.env.GITTER_STATUS || 'ok';
        this._message = process.env.GITTER_MESSAGE;

        this.sendNotify = this.sendNotify.bind(this);
    }

    sendNotify() {
        if (this._message) {
            return this._sendMessage(this._message);
        }

        return this._sendStatus();
    }

    _sendGitter(message, type) {
        return request({
            method: 'POST',
            uri: this._webhookUri,
            json: true,
            body: {
                message: message,
                status: type,
            },
        });
    }

    _sendMessage(text) {
        const template = Handlebars.compile(text);
        const message = template(Codefresh.info);

        return this._sendGitter(message, this._status);
    }

    _sendStatus() {
        const file = path.join(__dirname, '../messages/buildStatus.md');
        const data = fs.readFileSync(file, 'utf8');
        const template = Handlebars.compile(data);

        const statusTitle = this._status === 'ok' ? 'Build successful' : 'Build failed';

        const message = template({ ...Codefresh.info, title: statusTitle });

        return this._sendGitter(message, this._status);
    }
}

module.exports = Controller;
