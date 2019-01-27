import React, { Component } from 'react';
import {
  View,
  TouchableWithoutFeedback,
  Animated,
  Easing,
  StyleSheet,
  Dimensions,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  PanResponderInstance
} from 'react-native'

interface SideMenuProps {
  menu: any, //PropTypes.object.isRequired,
  shadowStyle: StyleSheet, //View.propTypes.style,
  menuStyle: StyleSheet, //View.propTypes.style,
  style: StyleSheet,
  direction: direction,
  type: type,
  position: Animated.Value, //PropTypes.object,
  width: number,
  animationFunction: (position: Animated.Value | Animated.ValueXY, width: number | Animated.Value | Animated.ValueXY) => Animated.CompositeAnimation,
  panGestureEnabled: boolean,
  panWidthFromEdge: number,
  panTolerance: { x: number, y: number },
  onPanMoveStart: () => void,
  onPanMove: () => void,
  onPanMoveEnd: () => void,
  onSliding: (slideValue: number, slideOffset: number) => void,
  onMenuStateChanged: () => void,
}

interface SideMenuState {
  position: any,
  isOpen: boolean,
  isMoving: boolean,
};

interface SlidingEvent {
  value: number;
}

enum direction {
  Left = 'left',
  Right = 'right'
};

enum type {
  Default = 'default',
  Overlay = 'overlay',
  Slide = 'slide'
};

const DEVICESCREEN = Dimensions.get('window');

export default class SideMenu extends Component<SideMenuProps, SideMenuState> {
  static direction = direction;
  static type = type;

  static defaultProps = {
    shadowStyle: { backgroundColor: 'rgba(0,0,0,.4)' },
    menuStyle: {},
    direction: direction.Left,
    type: type.Slide,
    position: new Animated.Value(0),
    width: DEVICESCREEN.width * 0.7,
    animationFunction: (prop: Animated.Value | Animated.ValueXY, value: number | Animated.Value | Animated.ValueXY | { x: number; y: number; }) => Animated.timing(prop, {
      easing: Easing.inOut(Easing.ease),
      duration: 300,
      toValue: value
    }),

    panGestureEnabled: true,
    panWidthFromEdge: 60,
    panTolerance: { x: 6, y: 20 },
    menu: <></>,
    style: {},
    onPanMoveStart: () => null,
    onPanMove: () => null,
    onPanMoveEnd: () => null,
    onSliding: () => null,
    onMenuStateChanged: () => null,
  };

  events: {
    onPanMoveStart: () => void;
    onPanMove: () => void;
    onPanMoveEnd: () => void;
    onSliding: (e: SlidingEvent) => void;
    onMenuStateChanged: (isOpen: boolean) => void;
  };

  panGestures: {
    panResponder: PanResponderInstance,
    handleOnStartShouldSetPanResponder: (e: GestureResponderEvent, gestureState: PanResponderGestureState) => boolean,
    handleOnStartShouldSetPanResponderCapture: (e: GestureResponderEvent, gestureState: PanResponderGestureState) => boolean,
    handleOnMoveShouldSetPanResponder: (e: GestureResponderEvent, gestureState: PanResponderGestureState) => boolean,
    handleOnMoveShouldSetPanResponderCapture: (e: GestureResponderEvent, gestureState: PanResponderGestureState) => boolean,
    handleOnPanResponderTerminationRequest: (e: GestureResponderEvent, gestureState: PanResponderGestureState) => boolean,
    handleOnPanResponderGrant: (e: GestureResponderEvent, gestureState: PanResponderGestureState) => void,
    handleOnPanResponderMove: (e: GestureResponderEvent, gestureState: PanResponderGestureState) => void,
    handleOnPanResponderRelease: (e: GestureResponderEvent, gestureState: PanResponderGestureState) => void,
    handleOnPanResponderTerminate: (e: GestureResponderEvent, gestureState: PanResponderGestureState) => void,
  };

  isPan: boolean;
  childrenLeft: Animated.AnimatedInterpolation;
  menuLeft: Animated.AnimatedInterpolation;
  shadowOpacity: Animated.AnimatedInterpolation;
  isVerticalMoved: boolean;

  constructor(props: Readonly<SideMenuProps>) {
    super(props);

    this.open = this.open.bind(this)
    this.close = this.close.bind(this)
    this.events = {
      onPanMoveStart: this.onPanMoveStart.bind(this),
      onPanMove: this.onPanMove.bind(this),
      onPanMoveEnd: this.onPanMoveEnd.bind(this),
      onSliding: this.onSliding.bind(this),
      onMenuStateChanged: this.onMenuStateChanged.bind(this),
    }

    this.panGestures = {      
      handleOnStartShouldSetPanResponder: this.handleOnStartShouldSetPanResponder.bind(this),
      handleOnStartShouldSetPanResponderCapture: this.handleOnStartShouldSetPanResponderCapture.bind(this),
      handleOnMoveShouldSetPanResponder: this.handleOnMoveShouldSetPanResponder.bind(this),
      handleOnMoveShouldSetPanResponderCapture: this.handleOnMoveShouldSetPanResponderCapture.bind(this),
      handleOnPanResponderTerminationRequest: this.handleOnPanResponderTerminationRequest.bind(this),
      handleOnPanResponderGrant: this.handleOnPanResponderGrant.bind(this),
      handleOnPanResponderMove: this.handleOnPanResponderMove.bind(this),
      handleOnPanResponderRelease: this.handleOnPanResponderEnd.bind(this),
      handleOnPanResponderTerminate: this.handleOnPanResponderEnd.bind(this),
      panResponder: PanResponder.create({
        onStartShouldSetPanResponder: this.handleOnStartShouldSetPanResponder,
        onStartShouldSetPanResponderCapture: this.handleOnStartShouldSetPanResponderCapture,
        onMoveShouldSetPanResponder: this.handleOnMoveShouldSetPanResponder,
        onMoveShouldSetPanResponderCapture: this.handleOnMoveShouldSetPanResponderCapture,
        onPanResponderTerminationRequest: this.handleOnPanResponderTerminationRequest,
        onPanResponderGrant: this.handleOnPanResponderGrant,
        onPanResponderMove: this.handleOnPanResponderMove,
        onPanResponderRelease: this.handleOnPanResponderRelease,
        onPanResponderTerminate: this.handleOnPanResponderTerminate,
      }),
    }

    this.isPan = false
    this.isVerticalMoved = false

    const { position } = props;
    this.state = {
      position,
      isOpen: false,
      isMoving: false
    };

    position.addListener(this.events.onSliding);


    this.childrenLeft = this.props.direction === direction.Left ?
      position.interpolate({
        inputRange: [0, DEVICESCREEN.width],
        outputRange: [0, DEVICESCREEN.width],
      }) :
      position.interpolate({
        inputRange: [0, DEVICESCREEN.width],
        outputRange: [0, -DEVICESCREEN.width],
      });

    this.menuLeft = this.props.direction === direction.Left ?
      position.interpolate({
        inputRange: [0, this.props.width],
        outputRange: [-this.props.width, 0],
      }) :
      position.interpolate({
        inputRange: [0, this.props.width],
        outputRange: [DEVICESCREEN.width, DEVICESCREEN.width - this.props.width],
      });

    this.shadowOpacity = position.interpolate({
      inputRange: [0, this.props.width],
      outputRange: [0, 1],
    })
  }

  componentWillUpdate(newProps: SideMenuProps, newState: SideMenuState) {
    if (newState.isOpen !== this.state.isOpen) {
      this.events.onMenuStateChanged(newState.isOpen);
    }
  }
  //#endregion

  //#region public api
  close() {
    this.setState({ isMoving: true });
    this.props
      .animationFunction(this.state.position, 0)
      .start(
        () => {
          if (!this.isPan) {
            this.setState({ isOpen: false, isMoving: false });
          }
        }
      );
  };

  open() {
    this.setState({ isMoving: true });
    this.props
      .animationFunction(this.state.position, this.props.width)
      .start(
        () => {
          if (!this.isPan) {
            this.setState({ isOpen: true, isMoving: false });
          }
        }
      );
  };
  //#endregion

  //#region private api
  //#endregion

  //#region events
  onPanMoveStart() {
    this.props.onPanMoveStart();
  }

  onPanMove() {
    this.props.onPanMove();
  }

  onPanMoveEnd() {
    this.props.onPanMoveEnd();
  }

  onSliding(e: SlidingEvent) {
    const slideOffset = e.value / this.props.width;
    this.props.onSliding(e.value, slideOffset);
  };

  onMenuStateChanged(isOpen: boolean) {
    this.props.onMenuStateChanged();
  }
  //#endregion

  //#region PanResponder
  handleOnStartShouldSetPanResponder(evt: GestureResponderEvent, gestureState: PanResponderGestureState) {
    this.isVerticalMoved = false;
    return false;
  };

  handleOnStartShouldSetPanResponderCapture(evt: GestureResponderEvent, gestureState: PanResponderGestureState) {
    return false;
  };

  handleOnMoveShouldSetPanResponder(evt: GestureResponderEvent, gestureState: PanResponderGestureState) {
    if (!this.props.panGestureEnabled || this.isVerticalMoved || this.state.isMoving) {
      return false;
    }

    const x = Math.round(Math.abs(gestureState.dx));
    const y = Math.round(Math.abs(gestureState.dy));
    const isHorizontalMoved = x > this.props.panTolerance.x && y < this.props.panTolerance.y;
    this.isVerticalMoved = x < this.props.panTolerance.x && y > this.props.panTolerance.y;

    if (!isHorizontalMoved) {
      return false;
    }

    const offset = this.props.panWidthFromEdge;
    const propDirection = this.props.direction;
    const { isOpen } = this.state;

    let shoudMove = false
    if (isOpen) {
      if (propDirection === direction.Left) {
        shoudMove = gestureState.dx < 0;
      } else {
        shoudMove = gestureState.dx > 0;
      }
    } else {
      if (propDirection === direction.Left) {
        shoudMove = gestureState.moveX <= offset && gestureState.dx > 0;
      } else {
        shoudMove = (DEVICESCREEN.width - gestureState.moveX <= offset) && gestureState.dx < 0;
      }
    }
    if (shoudMove) {
      this.isPan = true;
      this.setState({ isMoving: true });
    }

    return shoudMove;
  };

  handleOnMoveShouldSetPanResponderCapture(evt: GestureResponderEvent, gestureState: PanResponderGestureState) {
    return false;
  };

  handleOnPanResponderTerminationRequest(evt: GestureResponderEvent, gestureState: PanResponderGestureState) {
    return true;
  };

  handleOnPanResponderGrant(evt: GestureResponderEvent, gestureState: PanResponderGestureState) {
    this.events.onPanMoveStart();
    this.state.position.setOffset(this.state.position);
    this.state.position.setValue(0);
  };

  handleOnPanResponderMove(evt: GestureResponderEvent, gestureState: PanResponderGestureState) {
    const { dx } = gestureState;
    const position = this.props.direction === direction.Left ? dx : -dx;

    const x = Math.max(Math.min(position, this.props.width - this.state.position.offset), this.state.isOpen ? - this.props.width : 0);
    if (x !== this.state.position.value) {
      this.state.position.setValue(x);
      this.events.onPanMove();
    }
  };

  handleOnPanResponderEnd(evt: any, gestureState: { vx: number; }) {
    this.isPan = false;
    this.events.onPanMoveEnd();

    this.state.position.flattenOffset();
    const velocity = this.props.direction === direction.Left ? gestureState.vx : -gestureState.vx;
    const percent = this.state.position.value / this.props.width;
    if (velocity > 0.5) {
      this.open();
    } else if (velocity < -0.5) {
      this.close();
    } else if (percent > 0.5) {
      this.open();
    } else {
      this.close();
    }
  };

  handleOnPanResponderRelease() {
    return false;
  };

  handleOnPanResponderTerminate() {
    return false;
  };
  //#endregion

  //#region render
  render() {
    const { width, shadowStyle, menuStyle, children, menu, style } = this.props;
    const propDirection = this.props.direction;
    const propType = this.props.type;

    let shadowView = null;
    if (this.state.isMoving || this.state.isOpen) {
      shadowView = (<TouchableWithoutFeedback onPress={this.close}>
        <Animated.View style={[absoluteStyle, { opacity: this.shadowOpacity }, shadowStyle]}>
          <View style={{ width: width }}>
          </View>
        </Animated.View>
      </TouchableWithoutFeedback>)
    }

    let view: JSX.Element;
    if (propType === type.Default) {
      view = <View style={[styles.container, style]} {...this.panGestures.panResponder.panHandlers}>
        <View style={[absoluteStyle, { [propDirection === direction.Left ? 'right' : 'left']: DEVICESCREEN.width - width }, menuStyle]}>
          {menu}
        </View>
        <Animated.View style={[absoluteStyle, { left: this.childrenLeft, width: DEVICESCREEN.width }]}>
          {children}
          {shadowView}
        </Animated.View>
      </View>
    } else if (propType === type.Overlay) {
      view = <View style={[styles.container, style]} {...this.panGestures.panResponder.panHandlers}>
        {children}
        {shadowView}
        <Animated.View style={[absoluteStyle, { left: this.menuLeft, width: width }, menuStyle]}>
          {menu}
        </Animated.View>
      </View>
    } else {
      view = <View style={[styles.container, style]} {...this.panGestures.panResponder.panHandlers}>
        <Animated.View style={[absoluteStyle, { left: this.menuLeft, width: width }, menuStyle]}>
          {menu}
        </Animated.View>
        <Animated.View style={[absoluteStyle, { left: this.childrenLeft, width: DEVICESCREEN.width }]}>
          {children}
          {shadowView}
        </Animated.View>
      </View>
    }

    return (
      <>
        view
      </>
    );
  }
  //#endregion
}

//#region styles
const absoluteStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  backgroundColor: 'transparent',
  overflow: 'hidden',
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  menuStyle: {
    ...absoluteStyle,
  },
  shadow: {
    ...absoluteStyle,
  }
});
//#endregion