type Callback = (message: unknown) => void;

export class EventBus {
  private topics: Map<string, Callback[]> = new Map();

  public subscribe(topic: string, callback: Callback): void {
    if (!this.topics.has(topic)) this.topics.set(topic, []);
    this.topics.get(topic)?.push(callback);
  }

  public unsubscribe(topic: string, callback: Callback): void {
    const subscribers = this.topics.get(topic);
    if (!subscribers) return;

    this.topics.set(
      topic,
      subscribers.filter((subscriber) => subscriber !== callback),
    );
  }

  public publish(topic: string, message: unknown): void {
    const subscribers = this.topics.get(topic);
    if (!subscribers) return;

    subscribers.forEach((callback) => callback(message));
  }
}

export class Publisher {
  constructor(private eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  public publish(topic: string, message: unknown): void {
    this.eventBus.publish(topic, message);
  }
}

export class Subscriber {
  constructor(private eventBus: EventBus) {}

  public subscribe(topic: string, callback: (message: unknown) => void): void {
    this.eventBus.subscribe(topic, callback);
  }

  public unsubscribe(
    topic: string,
    callback: (message: unknown) => void,
  ): void {
    this.eventBus.unsubscribe(topic, callback);
  }
}

export function pubsubFactory() {
  const eventBus = new EventBus();
  const getPublisher = () => new Publisher(eventBus);
  const getSubscriber = () => new Subscriber(eventBus);

  return { getPublisher, getSubscriber };
}
