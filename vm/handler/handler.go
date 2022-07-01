package handler

import (
	"encoding/json"
	"errors"
	"io/ioutil"
	"net/http"
	"os"

	echo "github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"
)

type (
	Handler struct {
		dbFile string
		db     []*DronePipeline
	}

	//DronePipeline is the request data to save the Pipeline
	DronePipeline struct {
		ID           string `json:"id"`
		Name         string `json:"pipelineName"`
		Path         string `json:"pipelinePath"`
		PipelineFile string `json:"pipelineFile"`
	}
)

func NewHandler(dbFilePath string) (*Handler, error) {
	var err error
	var db []*DronePipeline
	if dbFilePath != "" {
		_, err = os.Stat(dbFilePath)
		if err != nil && !errors.Is(err, os.ErrNotExist) {
			return nil, err
		}
	}

	if err == nil && dbFilePath != "" {
		db, err = loadDB(dbFilePath)
	}

	if err != nil {
		return nil, err
	}

	return &Handler{
		dbFile: dbFilePath,
		db:     db,
	}, nil
}

func loadDB(dbFilePath string) ([]*DronePipeline, error) {
	var db []*DronePipeline
	b, err := ioutil.ReadFile(dbFilePath)
	if err != nil {
		return nil, err
	}

	err = json.Unmarshal(b, &db)

	if err != nil {
		return nil, err
	}

	return db, nil
}

func (h *Handler) GetPipelines(c echo.Context) error {
	log.Info("SavePipeline")
	var db []DronePipeline

	_, err := os.Stat(h.dbFile)
	if err != nil {
		return err
	}

	b, err := ioutil.ReadFile(h.dbFile)
	if err != nil {
		return err
	}

	if err := json.Unmarshal(b, &db); err != nil {
		return err
	}
	c.JSON(http.StatusOK, db)
	return nil
}

func (h *Handler) DeletePipeline(c echo.Context) error {
	var id string
	if err := echo.PathParamsBinder(c).
		String("id", &id).
		BindError(); err != nil {
		return err
	}

	if ok := h.hasElement(id); ok {
		i := h.indexOf(id)
		if i != -1 {
			h.db = append(h.db[:i], h.db[i+1:]...)
			if err := h.persistDB(); err != nil {
				return err
			}

			return c.NoContent(http.StatusNoContent)
		}
	}
	return echo.NewHTTPError(http.StatusNotFound, "pipeline not found")
}

func (h *Handler) SavePipelines(c echo.Context) error {
	log.Info("Save Pipelines")
	var dps []*DronePipeline
	if err := c.Bind(&dps); err != nil {
		return err
	}
	for _, dp := range dps {
		if !h.hasElement(dp.ID) {
			h.db = append(h.db, dp)
		}
	}
	h.persistDB()
	return c.JSON(http.StatusCreated, dps)
}

func (h *Handler) indexOf(id string) int {
	for i, e := range h.db {
		if e.ID == id {
			return i
		}
	}
	return -1
}

func (h *Handler) hasElement(id string) bool {
	for _, e := range h.db {
		if e.ID == id {
			return true
		}
	}
	return false
}

func (h *Handler) persistDB() error {
	b, err := json.Marshal(h.db)
	if err != nil {
		return err
	}
	if err := ioutil.WriteFile(h.dbFile, b, 0644); err != nil {
		return err
	}
	return nil
}
