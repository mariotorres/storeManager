##################################################
## Preproces inventory data
##################################################


## ----------------------------------------
## Libraries
## ----------------------------------------
library(stringr)
library(plyr)
library(dplyr)
library(stringdist)

## ----------------------------------------
## Functions
## ----------------------------------------

## Similarity Supplier
sim_sup <- function(supp, suppliers = c('Cocoon',
                                       'Eli Corame',
                                       'Ema Valdemosa',
                                       'Lessan',
                                       'Libertad',
                                       'Neon Nyx',
                                       'Nicoleta',
                                       'Punto Blanco')){
    strsim <- stringdist(tolower(supp),
                        tolower(suppliers))
    suppliers[which(strsim == min(strsim))[1]]
}

## Similarity Suppliers
n_sim_sup <- function(supp, suppliers = c('Cocoon',
                                         'Eli Corame',
                                         'Ema Valdemosa',
                                         'Lessan',
                                         'Libertad',
                                         'Neon Nyx',
                                         'Nicoleta',
                                         'Punto Blanco')){
    laply(supp, function(t)t <- sim_sup(t, suppliers))
}

## Mod Supp
mod_supp <- function(mod){
    mod <- str_trim(mod)
    ldply(mod, function(t)t <- c(
                              str_split(t, '[0-9] ')[[1]][1],
                              str_split(t, '[0-9] ')[[1]][2])
    )
}

## ----------------------------------------
## Read in data
## ----------------------------------------
data <- read.csv('celine.csv',
                stringsAsFactors = FALSE)
data <- data[str_length(data$Mod.) > 0,]

## ----------------------------------------
## Process data
## ----------------------------------------
clean_data          <- mod_supp(data$Mod.)
names(clean_data)   <- c('modelo', 'provedor')
clean_data$provedor <- n_sim_sup(clean_data$provedor)
## Fixes
clean_data$provedor[c(53, 54, 61, 98)]  <- 'Punto Blanco'
clean_data$provedor[c(146, 147)]        <- 'Ema Valdemosa'
## Marca
clean_data$marca <- n_sim_sup(data$Mod.,
                             c('Cocoon',
                               'Eli Corame',
                               'Ema Valdemosa',
                               'Lessan',
                               'Libertad',
                               'Neon Nyx',
                               'Nicoleta',
                               'Punto Blanco',
                               'D Mosseli'))
