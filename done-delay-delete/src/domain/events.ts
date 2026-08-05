export type ActionCreated = {
  type: "actionCreated";
  id: string;
  text: string;
  createdAt: number;
};

export type ActionDone = {
  type: "actionDone";
  id: string;
  doneAt: number;
};

export type ActionDelayed = {
  type: "actionDelayed";
  id: string;
  delayedAt: number;
  delayUntil: number;
};

export type ActionDeleted = {
  type: "actionDeleted";
  id: string;
  deletedAt: number;
};

export type ActionEvent =
  | ActionCreated
  | ActionDone
  | ActionDelayed
  | ActionDeleted;
