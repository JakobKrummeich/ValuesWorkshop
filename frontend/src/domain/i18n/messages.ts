import { generalMessages } from "./generalMessages";
import type { Message } from "./message";
import { MessageKey } from "./messageKey";
import { finalPresentationMessages } from "./phases/finalPresentationMessages";
import { finalVotingMessages } from "./phases/finalVotingMessages";
import { groupFormationMessages } from "./phases/groupFormationMessages";
import { groupWorkMessages } from "./phases/groupWorkMessages";
import { joinMessages } from "./phases/joinMessages";
import { quizMessages } from "./phases/quizMessages";
import { selectionMessages } from "./phases/selectionMessages";
import { selectionResultsMessages } from "./phases/selectionResultsMessages";
import { valuePresentationMessages } from "./phases/valuePresentationMessages";

export { MessageKey } from "./messageKey";

export const messages: Readonly<Record<MessageKey, Message>> = {
  ...generalMessages,
  ...joinMessages,
  ...quizMessages,
  ...selectionMessages,
  ...selectionResultsMessages,
  ...groupFormationMessages,
  ...groupWorkMessages,
  ...valuePresentationMessages,
  ...finalVotingMessages,
  ...finalPresentationMessages,
};
