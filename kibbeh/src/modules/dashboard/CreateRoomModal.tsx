import { Form, Formik } from "formik";
import React, { useContext } from "react";
import { InputField } from "../../form-fields/InputField";
import { useCurrentRoomStore } from "../../global-stores/useCurrentRoomStore";
import { roomToCurrentRoom } from "../../lib/roomToCurrentRoom";
import { showErrorToast } from "../../lib/showErrorToast";
import { useConn, useWrappedConn } from "../../shared-hooks/useConn";
import { useTypeSafeMutation } from "../../shared-hooks/useTypeSafeMutation";
import { useTypeSafeTranslation } from "../../shared-hooks/useTypeSafeTranslation";
import { Button } from "../../ui/Button";
import { Modal } from "../../ui/Modal";

interface CreateRoomModalProps {
  onRequestClose: () => void;
  name?: string;
  description?: string;
  isPrivate?: boolean;
  edit?: boolean;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  onRequestClose,
  name: currentName,
  description: currentDescription,
  isPrivate,
  edit,
}) => {
  const conn = useWrappedConn();
  const { t } = useTypeSafeTranslation();

  return (
    <Modal isOpen onRequestClose={onRequestClose}>
      <Formik<{
        name: string;
        privacy: string;
        description: string;
      }>
        initialValues={{
          name: currentName || "",
          description: currentDescription || "",
          privacy: isPrivate ? "private" : "public",
        }}
        validateOnChange={false}
        validateOnBlur={false}
        validate={({ name, description }) => {
          const errors: Record<string, string> = {};

          if (name.length < 2 || name.length > 60) {
            return {
              name: t("components.modals.createRoomModal.nameError"),
            };
          } else if (description.length > 500) {
            return {
              description: t(
                "components.modals.createRoomModal.descriptionError"
              ),
            };
          }

          return errors;
        }}
        onSubmit={async ({ name, privacy, description }) => {
          const d = { name, privacy, description };
          const resp = edit
            ? await conn.mutation.createRoom(d)
            : await conn.mutation.editRoom(d);

          if ("error" in resp) {
            showErrorToast(resp.error);

            return;
          } else if (resp.room) {
            const { room } = resp;

            console.log("new room voice server id: " + room.voiceServerId);
            // @todo
            // useRoomChatStore.getState().clearChat();
            // @todo
            // wsend({ op: "get_current_room_users", d: {} });
            // history.push("/room/" + room.id);
            useCurrentRoomStore
              .getState()
              .setCurrentRoom(() => roomToCurrentRoom(room));
          }

          onRequestClose();
        }}
      >
        {({ setFieldValue, values, isSubmitting }) => (
          <Form className={`grid grid-cols-3 gap-4 focus:outline-none`}>
            <div className={`col-span-3 block`}>
              <h3 className={`mb-2 text-3xl text-primary-100`}>
                {t("pages.home.createRoom")}
              </h3>
              <p className={`text-primary-300`}>
                Fill the following fields to start a new room
              </p>
            </div>
            <div className={`h-full w-full col-span-2`}>
              <InputField
                className={`rounded-8 bg-primary-700 pl-2 h-6`}
                name="name"
                maxLength={60}
                placeholder={t("components.modals.createRoomModal.roomName")}
                autoFocus
                autoComplete="off"
              />
            </div>
            <div className={`grid mt-8 items-start grid-cols-1 h-6`}>
              <select
                className={`h-full bg-primary-700 text-primary-100 placeholder-primary-300 focus:outline-none rounded-8 px-2`}
                value={values.privacy}
                onChange={(e) => {
                  setFieldValue("privacy", e.target.value);
                }}
              >
                <option value="public" className={`hover:bg-primary-900`}>
                  {t("components.modals.createRoomModal.public")}
                </option>
                <option value="private" className={`hover:bg-primary-900`}>
                  {t("components.modals.createRoomModal.private")}
                </option>
              </select>
            </div>
            <div className={`col-span-3 bg-primary-700 rounded-8`}>
              <InputField
                className={`px-2 h-11 col-span-3 w-full`}
                name="description"
                rows={7}
                maxLength={500}
                placeholder={t(
                  "components.modals.createRoomModal.roomDescription"
                )}
                textarea
              />
            </div>

            <div className={`flex mt-12 space-x-3`}>
              <Button loading={isSubmitting} type="submit" className={`ml-1.5`}>
                {t("common.ok")}
              </Button>
              <Button
                type="button"
                onClick={onRequestClose}
                className={`mr-1.5`}
                color="secondary"
              >
                {t("common.cancel")}
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </Modal>
  );
};
