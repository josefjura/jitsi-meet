import Tooltip from '@atlaskit/tooltip';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { translate } from '../../base/i18n';
import { shouldRemoteVideosBeVisible } from '../../filmstrip';

import {
    VIDEO_QUALITY_LEVELS
} from '../../base/conference';

const { HIGH, STANDARD, LOW } = VIDEO_QUALITY_LEVELS;

/**
 * Expected video resolutions placed into an array, sorted from lowest to
 * highest resolution.
 *
 * @type {number[]}
 */
const RESOLUTIONS
    = Object.values(VIDEO_QUALITY_LEVELS).sort((a, b) => a - b);

/**
 * A map of video resolution (number) to translation key.
 *
 * @type {Object}
 */
const RESOLUTION_TO_TRANSLATION_KEY = {
    [HIGH]: 'videoStatus.hd',
    [STANDARD]: 'videoStatus.sd',
    [LOW]: 'videoStatus.ld'
};

/**
 * React {@code Component} responsible for displaying a label that indicates
 * the displayed video state of the current conference. {@code AudioOnlyLabel}
 * will display when the conference is in audio only mode. {@code HDVideoLabel}
 * will display if not in audio only mode and a high-definition large video is
 * being displayed.
 */
export class VideoQualityLabel extends Component {
    /**
     * {@code VideoQualityLabel}'s property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Whether or not the conference is in audio only mode.
         */
        _audioOnly: React.PropTypes.bool,

        /**
         * Whether or not a connection to a conference has been established.
         */
        _conferenceStarted: React.PropTypes.bool,

        /**
         * Whether or not the filmstrip is displayed with remote videos. Used to
         * determine display classes to set.
         */
        _filmstripVisible: React.PropTypes.bool,

        /**
         * Whether or note remote videos are visible in the filmstrip,
         * regardless of count. Used to determine display classes to set.
         */
        _remoteVideosVisible: React.PropTypes.bool,

        /**
         * The current video resolution (height) to display a label for.
         */
        _resolution: React.PropTypes.number,

        /**
         * Invoked to obtain translated strings.
         */
        t: React.PropTypes.func
    };

    /**
     * Initializes a new {@code VideoQualityLabel} instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            /**
             * Whether or not the filmstrip is transitioning from not visible
             * to visible. Used to set a transition class for animation.
             *
             * @type {boolean}
             */
            togglingToVisible: false
        };
    }

    /**
     * Updates the state for whether or not the filmstrip is being toggled to
     * display after having being hidden.
     *
     * @inheritdoc
     * @param {Object} nextProps - The read-only props which this Component will
     * receive.
     * @returns {void}
     */
    componentWillReceiveProps(nextProps) {
        this.setState({
            togglingToVisible: nextProps._filmstripVisible
                && !this.props._filmstripVisible
        });
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            _audioOnly,
            _conferenceStarted,
            _filmstripVisible,
            _remoteVideosVisible,
            _resolution,
            t
        } = this.props;

        // FIXME The _conferenceStarted check is used to be defensive against
        // toggling audio only mode while there is no conference and hides the
        // need for error handling around audio only mode toggling.
        if (!_conferenceStarted) {
            return null;
        }

        // Determine which classes should be set on the component. These classes
        // will used to help with animations and setting position.
        const baseClasses = 'video-state-indicator moveToCorner';
        const filmstrip
            = _filmstripVisible ? 'with-filmstrip' : 'without-filmstrip';
        const remoteVideosVisible = _remoteVideosVisible
            ? 'with-remote-videos'
            : 'without-remote-videos';
        const opening = this.state.togglingToVisible ? 'opening' : '';
        const classNames
            = `${baseClasses} ${filmstrip} ${remoteVideosVisible} ${opening}`;

        return (
            <div
                className = { classNames }
                id = 'videoResolutionLabel'>
                <Tooltip
                    description = { t('videoStatus.labelTooltip') }
                    position = { 'left' }>
                    <div className = 'video-quality-label-status'>
                        { _audioOnly
                            ? <i className = 'icon-visibility-off' />
                            : this._mapResolutionToTranslation(_resolution) }
                    </div>
                </Tooltip>
            </div>
        );
    }

    /**
     * Matches the passed in resolution with a translation key for describing
     * the resolution. The passed in resolution will be matched with a known
     * resolution that it is at least greater than or equal to.
     *
     * @param {number} resolution - The video height to match with a
     * translation.
     * @private
     * @returns {string}
     */
    _mapResolutionToTranslation(resolution) {
        // Set the default matching resolution of the lowest just in case a
        // match is not found.
        let highestMatchingResolution = RESOLUTIONS[0];

        for (let i = 0; i < RESOLUTIONS.length; i++) {
            const knownResolution = RESOLUTIONS[i];

            if (resolution >= knownResolution) {
                highestMatchingResolution = knownResolution;
            } else {
                break;
            }
        }

        return this.props.t(
            RESOLUTION_TO_TRANSLATION_KEY[highestMatchingResolution]);
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code VideoQualityLabel}'s
 * props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _audioOnly: boolean,
 *     _conferenceStarted: boolean,
 *     _filmstripVisible: true,
 *     _remoteVideosVisible: boolean,
 *     _resolution: number
 * }}
 */
function _mapStateToProps(state) {
    const { audioOnly, conference } = state['features/base/conference'];
    const { visible } = state['features/filmstrip'];
    const { resolution } = state['features/large-video'];

    return {
        _audioOnly: audioOnly,
        _conferenceStarted: Boolean(conference),
        _filmstripVisible: visible,
        _remoteVideosVisible: shouldRemoteVideosBeVisible(state),
        _resolution: resolution
    };
}

export default translate(connect(_mapStateToProps)(VideoQualityLabel));
