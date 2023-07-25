'use strict'

const form = document.querySelector('.form')
const containerWorkouts = document.querySelector('.workouts')
const inputType = document.querySelector('.form__input--type')
const inputDistance = document.querySelector('.form__input--distance')
const inputDuration = document.querySelector('.form__input--duration')
const inputCadence = document.querySelector('.form__input--cadence')
const inputElevation = document.querySelector('.form__input--elevation')

class Workout {
  date = new Date()
  id = (Date.now() + '').slice(-10)
  constructor(coords, distance, duration) {
    this.coords = coords
    this.distance = distance
    this.duration = duration
  }
  _setDescription() {
    // prettier-ignore
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December",]
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`
  }
}

class Running extends Workout {
  type = 'running'
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration)
    this.cadence = cadence
    this.calcPace()
    this._setDescription()
  }
  calcPace() {
    this.pace = this.distance / this.distance
    return this.pace
  }
}

class Cycling extends Workout {
  type = 'cycling'
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration)
    this.elevation = elevation
    this.calcSpeed()
    this._setDescription()
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60)
    return this.speed
  }
}

class App {
  _workouts = []
  _map
  _mapEvent
  constructor() {
    // Running Application Logic
    this._getPosition()

    // Get data from LS
    this._getLocalStorage()

    // The event handler that calls the __newWorkout method
    form.addEventListener('submit', this._newWorkout.bind(this))

    // The event handler that calls the _toggleField method
    inputType.addEventListener('change', this._toggleField)

    // The event handler that calls the _moveToPopup method
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this))

    containerWorkouts.addEventListener(
      'dblclick',
      this._deleteWorkout.bind(this)
    )
  }

  // Method for requesting location data from the user. If successful, the _loadMap function is run
  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),

        // Modal window in case of failure
        function () {
          alert('You have not provided access to your location')
        }
      )
  }

  // The method of loading the map on the page, in case of a positive answer about providing your coordinates
  _loadMap(position) {
    const { latitude, longitude } = position.coords
    const coords = [latitude, longitude]

    this._map = L.map('map').setView(coords, 13)

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this._map)

    // Map click event handler that will run the _showForm method
    this._map.on('click', this._showForm.bind(this))

    this._workouts.forEach((workout) => {
      this._renderWorkMarke(workout)
    })
  }

  // Method that will display the form when clicking on the map
  _showForm(mapE) {
    this._mapEvent = mapE
    form.classList.remove('hidden')
    inputDistance.focus()
  }

  // Method that switches workout types
  _toggleField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden')
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden')
  }

  // Method that will set the marker on the map
  _newWorkout(e) {
    e.preventDefault()

    const validInputs = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp))
    const allPosition = (...inputs) => inputs.every((inp) => inp > 0)

    // Data from forms

    const type = inputType.value
    const distance = +inputDistance.value
    const duration = +inputDuration.value
    const { lat, lng } = this._mapEvent.latlng
    let workout

    // Check that the data is correct
    if (type === 'running') {
      const cadence = +inputCadence.value

      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validInputs(distance, duration, cadence) ||
        !allPosition(distance, duration, cadence)
      ) {
        return alert('Необходимо ввести целое положительное число')
      }
      // If it's a run, create a run object
      workout = new Running([lat, lng], distance, duration, cadence)
    }

    if (type === 'cycling') {
      const elevation = +inputElevation.value

      if (
        !validInputs(distance, duration, elevation) ||
        !allPosition(distance, duration)
      ) {
        return alert('Необходимо ввести целое положительное число')
      }
      // If it's a bike, create a bike object
      workout = new Cycling([lat, lng], distance, duration, elevation)
    }
    // Add object to workout array
    this._workouts.push(workout)

    // Rendering a training marker on the map
    this._renderWorkMarke(workout)

    // Rendering a working out after sending form
    this._renderWorkout(workout)

    // Clear input fields and hide form
    this._hideForm()

    this._setLocalStorage()
  }

  _renderWorkMarke(workout) {
    L.marker(workout.coords)
      .addTo(this._map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: 'mark-popup',
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup()
  }

  _hideForm() {
    inputType.value =
      inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        ''
    form.classList.add('hidden')
  }

  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`

    if (workout.type === 'running') {
      html += `
              <div class="workout__details">
              <span class="workout__icon">⚡️</span>
              <span class="workout__value">${workout.pace.toFixed(1)}</span>
              <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
              <span class="workout__icon">🦶🏼</span>
              <span class="workout__value">${workout.cadence}</span>
              <span class="workout__unit">step</span>
            </div>
          </li>
              `
    }

    if (workout.type === 'cycling') {
      html += `
      <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.speed.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.elevation}</span>
      <span class="workout__unit">step</span>
    </div>
  </li>`
    }

    form.insertAdjacentHTML('afterend', html)
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout')
    if (!workoutEl) return
    this._hideForm()
    const workout = this._workouts.find(
      (workout) => workout.id === workoutEl.dataset.id
    )
    this._map.setView(workout.coords, 13, {
      animate: true,
      pan: { duration: 1 },
    })
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this._workouts))
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'))

    if (!data) return

    this._workouts = data
    this._workouts.forEach((workout) => {
      this._renderWorkout(workout)
    })
  }

  _deleteWorkout(e) {
    const workoutEl = e.target.closest('.workout')
    if (!workoutEl) return
    const workouts = this._workouts.filter(
      (work) => work.id !== workoutEl.dataset.id
    )
    localStorage.setItem('workouts', JSON.stringify(workouts))
    location.reload()
  }

  reset() {
    localStorage.removeItem('workouts')
    location.reload()
  }
}

const app = new App()
